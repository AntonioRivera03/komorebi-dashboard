import io
import socket
import time
from email.message import Message

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

from komorebi_server.capabilities.learn import source_import as imports
from komorebi_server.core.jobs import Worker
from komorebi_server.shared.contracts.common import AppError, new_id


def test_clean_html_keeps_readable_structure_and_drops_page_chrome():
    title, content = imports.clean_html("""
    <html><head><title>A lesson</title><style>private-css</style></head><body>
    <nav>Navigation links</nav><article><h1>Memory</h1><p>A <b>bold</b> idea.</p>
    <ul><li>One</li><li>Two</li></ul><script>secretScript()</script>
    <!-- hidden comment --><p hidden>Hidden content</p></article>
    <footer>Footer</footer></body></html>
    """)
    assert title == "A lesson"
    assert "Memory\n\nA bold idea." in content
    assert "• One" in content and "• Two" in content
    assert all(
        word not in content for word in ("Navigation", "script", "Footer", "Hidden", "comment")
    )
    with pytest.raises(AppError):
        imports.clean_html("<html><script>onlyJavascript()</script></html>")


@pytest.mark.parametrize(
    "address",
    ["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "fc00::1", "224.0.0.1", "2002:7f00:1::"],
)
def test_dns_private_special_and_transition_addresses_are_rejected(monkeypatch, address):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *a, **kw: [(2, 1, 6, "", (address, 80))])
    with pytest.raises(AppError):
        imports.public_target("https://example.com/", time.monotonic() + 5)


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",
        "http://user:pass@example.com",
        "http://example.com:8080",
        "https://example.com\\@localhost",
        "http://example.com\r\nBad: header",
    ],
)
def test_unsafe_url_forms_are_rejected(url):
    with pytest.raises(AppError):
        imports.public_target(url, time.monotonic() + 5)


class Response:
    def __init__(
        self,
        body=b"<article><h1>Hello</h1><p>Readable content.</p></article>",
        status=200,
        **headers,
    ):
        self.status = status
        self.headers = Message()
        self.headers["Content-Type"] = "text/html; charset=utf-8"
        for name, value in headers.items():
            self.headers[name.replace("_", "-")] = value
        self.body = io.BytesIO(body)

    def getheader(self, name, default=None):
        return self.headers.get(name, default)

    def read1(self, size):
        return self.body.read(size)


def mock_network(monkeypatch, responses):
    calls = []
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, *a, **kw: [
            (2, 1, 6, "", ("127.0.0.1" if host == "localhost" else "93.184.216.34", 443))
        ],
    )

    class Connection:
        sock = None

        def __init__(self, host, port, ip, timeout):
            calls.append((host, ip))

        def request(self, method, path, headers):
            assert "Cookie" not in headers and "Authorization" not in headers

        def getresponse(self):
            return responses.pop(0)

        def close(self):
            pass

    monkeypatch.setattr(imports, "PinnedHTTPS", Connection)
    monkeypatch.setattr(imports, "PinnedHTTP", Connection)
    return calls


def test_remote_processing_pins_dns_and_revalidates_redirects(client, monkeypatch):
    calls = mock_network(
        monkeypatch, [Response(status=302, Location="https://example.org/article"), Response()]
    )
    result = client.post("/api/v1/learn/sources/website", json={"url": "https://example.com/start"})
    assert result.status_code == 200, result.text
    assert result.json()["content"] == "Hello\n\nReadable content."
    assert result.json()["url"] == "https://example.org/article"
    assert calls == [("example.com", "93.184.216.34"), ("example.org", "93.184.216.34")]
    calls = mock_network(monkeypatch, [Response(status=302, Location="http://localhost/private")])
    result = client.post("/api/v1/learn/sources/website", json={"url": "https://example.com/start"})
    assert result.status_code == 400
    assert len(calls) == 1
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 0


def test_remote_failure_and_size_limit_offer_paste_fallback(client, monkeypatch):
    for response in [
        Response(status=403),
        Response(body=b"x" * (imports.MAX_BYTES + 1)),
        Response(Content_Encoding="gzip"),
    ]:
        mock_network(monkeypatch, [response])
        result = client.post("/api/v1/learn/sources/website", json={"url": "https://example.com"})
        assert result.status_code == 400
        assert result.json()["code"] == "source_import_failed"


def test_import_requires_authenticated_owner_and_csrf(client, app):
    with TestClient(app) as anonymous:
        assert (
            anonymous.post(
                "/api/v1/learn/sources/website", json={"url": "https://example.com"}
            ).status_code
            == 401
        )
    token = client.headers.pop("X-CSRF-Token")
    assert (
        client.post(
            "/api/v1/learn/sources/website", json={"url": "https://example.com"}
        ).status_code
        == 403
    )
    client.headers["X-CSRF-Token"] = token
    pairing = client.post("/api/v1/core/pairings", json={"name": "Display"}).json()
    with TestClient(app) as display:
        login = display.post("/api/v1/core/session", json={"ticket": pairing["ticket"]}).json()
        display.headers["X-CSRF-Token"] = login["csrfToken"]
        assert (
            display.post(
                "/api/v1/learn/sources/website", json={"url": "https://example.com"}
            ).status_code
            == 403
        )


def test_uploaded_text_html_and_pdf_are_extracted_without_saving(client, app):
    client.headers["Idempotency-Key"] = new_id()
    for filename, raw, expected in [
        ("notes.txt", b"Plain text", "Plain text"),
        ("page.html", b"<article><p>Read me</p><script>bad()</script></article>", "Read me"),
    ]:
        result = client.post("/api/v1/learn/sources/file", files={"file": (filename, raw)})
        assert result.status_code == 200, result.text
        assert result.json()["content"] == expected
    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
    )
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 20 200 Td (A readable PDF.) Tj ET")
    page[NameObject("/Contents")] = stream
    data = io.BytesIO()
    writer.write(data)
    result = client.post(
        "/api/v1/learn/sources/file", files={"file": ("lesson.pdf", data.getvalue())}
    )
    assert result.status_code == 202, result.text
    import_id = result.json()["id"]
    Worker(app.state.platform, app.state.modules).tick()
    result = client.get(f"/api/v1/learn/sources/imports/{import_id}")
    assert result.json()["status"] == "ready", result.text
    assert "A readable PDF." in result.json()["result"]["content"]
    assert client.get("/api/v1/learn/workspace").json()["data"]["revision"] == 0
    result = client.post(
        "/api/v1/learn/sources/file",
        files={"file": ("broken.pdf", b"not a pdf")},
        headers={"Idempotency-Key": new_id()},
    )
    assert result.status_code == 202
    Worker(app.state.platform, app.state.modules).tick()
    assert (
        client.get(f"/api/v1/learn/sources/imports/{result.json()['id']}").json()["status"]
        == "failed"
    )
