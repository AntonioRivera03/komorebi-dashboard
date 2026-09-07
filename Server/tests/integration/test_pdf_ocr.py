import io
import shutil
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from sqlalchemy import select

from komorebi_server.capabilities.learn import file_jobs
from komorebi_server.capabilities.learn.file_jobs import SourceImports
from komorebi_server.capabilities.learn.import_limits import MAX_FILE_BYTES
from komorebi_server.capabilities.learn.models import SourceImport
from komorebi_server.core.identity import issue_ticket
from komorebi_server.core.jobs import Worker
from komorebi_server.core.models import Job, User
from komorebi_server.shared.contracts.common import new_id, utcnow


def upload(client, data, key=None):
    return client.post(
        "/api/v1/learn/sources/file",
        files={"file": ("scan.pdf", data)},
        headers={"Idempotency-Key": key or new_id()},
    )


def status(client, import_id):
    return client.get(f"/api/v1/learn/sources/imports/{import_id}")


def scanned_pdf():
    image = Image.new("RGB", (1400, 500), "white")
    ImageDraw.Draw(image).text(
        (70, 150),
        "Scanned chapter about memory",
        fill="black",
        font=ImageFont.load_default(size=55),
    )
    buffer = io.BytesIO()
    image.save(buffer, format="PDF", resolution=150)
    return buffer.getvalue()


@pytest.mark.skipif(
    not shutil.which("tesseract") or not shutil.which("gs"), reason="OCR system tools required"
)
def test_real_scanned_and_mixed_pdf_extraction(client, app, tmp_path):
    # Add a genuine selectable-text page to a scanned PDF. OCR must preserve both.
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {
                    NameObject("/F1"): DictionaryObject(
                        {
                            NameObject("/Type"): NameObject("/Font"),
                            NameObject("/Subtype"): NameObject("/Type1"),
                            NameObject("/BaseFont"): NameObject("/Helvetica"),
                        }
                    ),
                }
            )
        }
    )
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 20 200 Td (Existing selectable text.) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    writer.append(PdfReader(io.BytesIO(scanned_pdf())))
    # Real, parseable PDF above the old 2 MB limit.
    writer.add_metadata({"/Padding": "x" * 3_000_000})
    mixed = io.BytesIO()
    writer.write(mixed)
    worker = Worker(app.state.platform, app.state.modules)
    for data in (scanned_pdf(), mixed.getvalue()):
        result = upload(client, data)
        assert result.status_code == 202, result.text
        import_id = result.json()["id"]
        assert status(client, import_id).json()["status"] == "queued"
        worker.tick()
        result = status(client, import_id).json()
        assert result["status"] == "ready", result
        assert "Scanned chapter about memory" in " ".join(result["result"]["content"].split())
        if data == mixed.getvalue():
            assert "Existing selectable text." in result["result"]["content"]
        with app.state.platform.db.transaction() as session:
            assert session.get(SourceImport, import_id).data is None
        assert client.delete(f"/api/v1/learn/sources/imports/{import_id}").status_code == 204
        assert status(client, import_id).status_code == 404
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 0


def test_upload_boundary_idempotency_and_ownership(client, app):
    key = new_id()
    data = b"x" * MAX_FILE_BYTES
    response = upload(client, data, key)
    assert response.status_code == 202
    import_id = response.json()["id"]
    assert upload(client, data, key).json()["id"] == import_id
    assert upload(client, b"different", key).status_code == 409
    assert upload(client, data + b"x").status_code == 400
    with TestClient(app) as other:
        assert upload(other, b"pdf").status_code == 401
        assert status(other, import_id).status_code == 401
        with app.state.platform.db.transaction() as session:
            user = User(name="Other owner")
            session.add(user)
            session.flush()
            ticket = issue_ticket(session, user.id, "owner", ["*"], "Other owner")
        auth = other.post("/api/v1/core/session", json={"ticket": ticket}).json()
        other.headers["X-CSRF-Token"] = auth["csrfToken"]
        assert status(other, import_id).status_code == 404
        assert other.delete(f"/api/v1/learn/sources/imports/{import_id}").status_code == 404
    token = client.headers.pop("X-CSRF-Token")
    assert client.delete(f"/api/v1/learn/sources/imports/{import_id}").status_code == 403
    assert upload(client, b"pdf").status_code == 403
    client.headers["X-CSRF-Token"] = token
    assert client.delete(f"/api/v1/learn/sources/imports/{import_id}").status_code == 204
    with app.state.platform.db.transaction() as session:
        assert session.get(SourceImport, import_id) is None
        assert session.get(Job, import_id).status == "canceled"


def test_cancellation_expiry_and_long_job_lease(client, app, monkeypatch):
    worker = Worker(app.state.platform, app.state.modules)
    import_id = upload(client, b"pdf").json()["id"]
    claim = worker.claim()
    assert claim.lease_until > utcnow() + timedelta(seconds=350)
    assert status(client, import_id).json()["status"] == "processing"

    def cancel_during_ocr(data, filename, canceled):
        client.delete(f"/api/v1/learn/sources/imports/{import_id}")
        assert canceled()
        return {"title": "must not return", "content": "discarded"}

    monkeypatch.setattr(file_jobs, "extract_in_process", cancel_during_ocr)
    worker.process(claim)
    assert status(client, import_id).status_code == 404
    expired = upload(client, b"pdf").json()["id"]
    with app.state.platform.db.transaction() as session:
        session.get(SourceImport, expired).expires_at = utcnow() - timedelta(seconds=1)
    SourceImports(app.state.platform).cleanup()
    with app.state.platform.db.transaction() as session:
        assert session.get(SourceImport, expired) is None


def test_failed_session_releases_upload_and_pending_imports_are_bounded(client, app):
    import_id = upload(client, b"pdf").json()["id"]
    with app.state.platform.db.transaction() as session:
        session.get(Job, import_id).status = "failed"
    assert status(client, import_id).json()["status"] == "failed"
    with app.state.platform.db.transaction() as session:
        assert session.get(SourceImport, import_id).data is None
    for _ in range(4):
        assert upload(client, b"pdf").status_code == 202
    assert upload(client, b"pdf").status_code == 429
    with app.state.platform.db.transaction() as session:
        assert len(list(session.scalars(select(SourceImport)))) == 5


def test_encrypted_and_over_page_limit_pdfs_fail_visibly(client, app):
    for pages, encrypted in ((1, True), (101, False)):
        writer = PdfWriter()
        for _ in range(pages):
            writer.add_blank_page(width=100, height=100)
        if encrypted:
            writer.encrypt("password")
        buffer = io.BytesIO()
        writer.write(buffer)
        import_id = upload(client, buffer.getvalue()).json()["id"]
        Worker(app.state.platform, app.state.modules).tick()
        result = status(client, import_id).json()
        assert result["status"] == "failed", result
        assert "unencrypted PDF" in result["message"]


def test_process_timeout_cleans_scratch_directory(monkeypatch, tmp_path):
    monkeypatch.setattr(file_jobs.tempfile, "tempdir", str(tmp_path))
    monkeypatch.setattr(file_jobs, "FILE_TIMEOUT", 0)
    with pytest.raises(file_jobs.AppError, match="five minutes"):
        file_jobs.extract_in_process(b"pdf", "scan.pdf")
    assert list(tmp_path.iterdir()) == []
