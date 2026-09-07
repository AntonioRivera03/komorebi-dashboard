"""Short-lived, owner-scoped PDF imports. Jobs never contain document bytes or text."""

import hashlib
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from datetime import timedelta
from pathlib import Path

from sqlalchemy import delete, func, select, update

from komorebi_server.capabilities.learn.import_limits import FILE_TIMEOUT
from komorebi_server.capabilities.learn.models import SourceImport
from komorebi_server.capabilities.learn.source_import import import_error
from komorebi_server.core.jobs import cancel_job, enqueue, job_status
from komorebi_server.core.transactions import command
from komorebi_server.shared.contracts.common import AppError, utcnow
from komorebi_server.shared.contracts.learn import ExtractedSource, SourceImportView

FILE_ERROR = (
    "The file could not be read. Use an unencrypted PDF with up to 100 pages, "
    "UTF-8 text, Markdown or HTML, or paste its contents."
)


def extract_in_process(data, filename, canceled=lambda: False):
    # The parent owns the directory so even killed OCR descendants leave no scratch files.
    with tempfile.TemporaryDirectory(prefix="komorebi-import-") as scratch:
        with subprocess.Popen(
            [sys.executable, "-m", "komorebi_server.capabilities.learn.file_extract", filename],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
            env={**os.environ, "TMPDIR": scratch, "OMP_THREAD_LIMIT": "1"},
        ) as process:
            deadline = time.monotonic() + (
                FILE_TIMEOUT if filename.lower().endswith(".pdf") else 12
            )
            pending = data
            try:
                while True:
                    if canceled():
                        raise import_error("Processing was canceled or expired.")
                    if time.monotonic() >= deadline:
                        raise import_error(
                            "PDF processing exceeded five minutes. Try a smaller section."
                        )
                    try:
                        output, _ = process.communicate(input=pending, timeout=1)
                        break
                    except subprocess.TimeoutExpired:
                        pending = None
                if process.returncode:
                    raise import_error(FILE_ERROR)
                result = json.loads(output)
                if "error" in result:
                    raise import_error(result["error"])
                return ExtractedSource.model_validate(result).model_dump(mode="json")
            except (ValueError, OSError):
                raise import_error(FILE_ERROR) from None
            finally:
                # Kill the whole process group, including Tesseract/Ghostscript on timeout.
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.communicate()


class SourceImports:
    def __init__(self, platform):
        self.platform = platform

    def cleanup(self):
        with self.platform.db.transaction() as session:
            session.execute(delete(SourceImport).where(SourceImport.expires_at <= utcnow()))

    def create(self, ctx, filename, data, key):
        ctx.require("learn:write")
        self.cleanup()
        with self.platform.db.transaction() as session:

            def execute():
                count = session.scalar(
                    select(func.count())
                    .select_from(SourceImport)
                    .where(
                        SourceImport.user_id == ctx.actor_id,
                    )
                )
                if count >= 5:
                    raise AppError(
                        "import_limit", "Finish or cancel an existing PDF import first.", 429
                    )
                job_id = enqueue(
                    session,
                    ctx,
                    "learn",
                    "learn.sourceImport.v1",
                    {},
                    f"learn.sourceImport:{ctx.actor_id}:{key}",
                )
                session.add(
                    SourceImport(
                        id=job_id,
                        user_id=ctx.actor_id,
                        filename=Path(filename).name[:300],
                        data=data,
                        expires_at=utcnow() + timedelta(hours=1),
                    )
                )
                return SourceImportView(id=job_id, status="queued").model_dump(mode="json")

            return command(
                session,
                ctx,
                "learn.import",
                key,
                {
                    "filename": filename,
                    "sha256": hashlib.sha256(data).hexdigest(),
                },
                execute,
            )

    def owned(self, session, ctx, import_id):
        row = session.get(SourceImport, import_id)
        if row is None or row.user_id != ctx.actor_id or row.expires_at <= utcnow():
            raise AppError(
                "not_found", "This import expired or is unavailable. Process it again.", 404
            )
        return row

    def get(self, ctx, import_id):
        ctx.require("learn:read")
        with self.platform.db.transaction() as session:
            row = self.owned(session, ctx, import_id)
            status = job_status(session, ctx, import_id)
            if row.result:
                return SourceImportView(id=row.id, status="ready", result=row.result)
            if row.error or status in {"failed", "canceled", "unknown_outcome"}:
                row.data = None
                return SourceImportView(
                    id=row.id,
                    status="failed",
                    message=row.error or "Processing stopped. Sign in again and retry the import.",
                )
            return SourceImportView(
                id=row.id, status="processing" if status == "running" else "queued"
            )

    def discard(self, ctx, import_id):
        ctx.require("learn:write")
        with self.platform.db.transaction() as session:
            self.owned(session, ctx, import_id)
            cancel_job(session, ctx, import_id)
            session.execute(delete(SourceImport).where(SourceImport.id == import_id))

    def process(self, ctx, payload, job_id):
        with self.platform.db.transaction() as session:
            row = self.owned(session, ctx, job_id)
            if row.result or row.error:
                return
            data, filename = row.data, row.filename

        def canceled():
            with self.platform.db.transaction() as session:
                row = session.get(SourceImport, job_id)
                return row is None or row.expires_at <= utcnow()

        result, error = None, None
        try:
            result = extract_in_process(data, filename, canceled)
        except AppError as exc:
            error = exc.message
        with self.platform.db.transaction() as session:
            session.execute(
                update(SourceImport)
                .where(
                    SourceImport.id == job_id,
                    SourceImport.user_id == ctx.actor_id,
                    SourceImport.expires_at > utcnow(),
                )
                .values(data=None, result=result, error=error)
            )
        if error:
            raise import_error(error)
