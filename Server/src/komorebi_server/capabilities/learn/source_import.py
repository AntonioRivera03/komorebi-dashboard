"""Bounded source extraction; remote sockets are pinned to validated public addresses."""

import http.client
import ipaddress
import re
import socket
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from threading import BoundedSemaphore
from urllib.parse import quote, urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup, Comment, NavigableString

from komorebi_server.shared.contracts.common import AppError

MAX_BYTES = 2_000_000
MAX_TEXT = 200_000
DNS = ThreadPoolExecutor(max_workers=4, thread_name_prefix="source-dns")
SLOTS = BoundedSemaphore(4)


def import_error(message="This source could not be processed. Paste its contents instead."):
    return AppError("source_import_failed", message, 400)


def clean_html(content):
    soup = BeautifulSoup(content, "html.parser")
    title = soup.title.get_text(" ", strip=True)[:300] if soup.title else ""
    for node in soup.select(
        "script, style, noscript, template, iframe, object, svg, form, nav, footer, "
        "[hidden], [aria-hidden='true']"
    ):
        node.decompose()
    for node in soup.find_all(string=lambda text: isinstance(text, Comment)):
        node.extract()
    root = soup.find("article") or soup.find("main") or soup.body or soup
    for node in root.find_all(["head", "title"]):
        node.decompose()
    for node in root.find_all("br"):
        node.replace_with("\n")
    # Collapse HTML source formatting, keeping actual block/line boundaries.
    for node in list(root.find_all(string=True)):
        if node != "\n":
            node.replace_with(re.sub(r"\s+", " ", str(node)))
    for node in root.find_all(
        [
            "p",
            "div",
            "section",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "ul",
            "ol",
            "blockquote",
            "pre",
            "tr",
        ]
    ):
        node.insert_before(NavigableString("\n\n"))
        node.insert_after(NavigableString("\n\n"))
    for node in root.find_all("li"):
        node.insert_before(NavigableString("\n• "))
        node.insert_after(NavigableString("\n"))
    for node in root.find_all(["td", "th"]):
        node.insert_after(NavigableString(" | "))
    text = root.get_text()
    text = "\n".join(line.strip() for line in text.splitlines())
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) < 1000 and re.search(
        r"access denied|just a moment|verify you are human", title, re.I
    ):
        raise import_error(
            "The website requires browser access. Copy its text and paste it instead."
        )
    return title, checked_text(text)


def checked_text(text):
    text = text.replace("\x00", "").strip()
    if not text:
        raise import_error("No readable text was found. Copy and paste the contents instead.")
    if len(text) > MAX_TEXT:
        raise import_error("This source is too long. Paste a section of up to 200,000 characters.")
    return text


def public_target(url, deadline):
    try:
        if len(url) > 2000 or any(ord(c) < 32 for c in url) or "\\" in url:
            raise ValueError()
        parsed = urlsplit(url)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError()
        host = parsed.hostname.encode("idna").decode("ascii")
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        if port not in {80, 443}:
            raise ValueError()
        future = DNS.submit(socket.getaddrinfo, host, port, type=socket.SOCK_STREAM)
        try:
            addresses = future.result(timeout=max(0.01, min(3, deadline - time.monotonic())))
        except TimeoutError:
            future.cancel()
            raise
        ips = {address[4][0] for address in addresses}

        def allowed(value):
            ip = ipaddress.ip_address(value)
            return (
                ip.is_global
                and not ip.is_multicast
                and not ip.is_reserved
                and not getattr(ip, "sixtofour", None)
                and not getattr(ip, "teredo", None)
            )

        if not ips or not all(allowed(ip) for ip in ips):
            raise ValueError()
        return parsed, host, port, sorted(ips)[0]
    except (ValueError, UnicodeError, OSError, TimeoutError):
        raise import_error(
            "Use a public HTTP or HTTPS website URL. You can also paste its text."
        ) from None


class PinnedHTTP(http.client.HTTPConnection):
    def __init__(self, host, port, ip, timeout):
        super().__init__(host, port=port, timeout=timeout)
        self.ip = ip

    def connect(self):
        self.sock = socket.create_connection((self.ip, self.port), timeout=self.timeout)


class PinnedHTTPS(PinnedHTTP):
    def connect(self):
        super().connect()
        self.sock = ssl.create_default_context().wrap_socket(self.sock, server_hostname=self.host)


def fetch_website(url):
    if not SLOTS.acquire(blocking=False):
        raise import_error(
            "Other sources are processing. Try again in a moment, or paste the text."
        )
    deadline = time.monotonic() + 20
    try:
        for _ in range(4):
            parsed, host, port, ip = public_target(url, deadline)
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError()
            connection_type = PinnedHTTPS if parsed.scheme == "https" else PinnedHTTP
            connection = connection_type(host, port, ip, min(5, remaining))
            try:
                target = quote(
                    urlunsplit(("", "", parsed.path or "/", parsed.query, "")),
                    safe="/%?=&:+,;@!$'()*~-._",
                )
                connection.request(
                    "GET",
                    target,
                    headers={
                        "User-Agent": "Komorebi-SourceReader/1.0",
                        "Accept": "text/html,text/plain",
                        "Accept-Encoding": "identity",
                    },
                )
                response = connection.getresponse()
                if response.status in {301, 302, 303, 307, 308}:
                    location = response.getheader("Location")
                    if not location:
                        raise import_error()
                    # Resolve and revalidate every hop. Never carry cookies or credentials.
                    url = urljoin(url, location)
                    continue
                if response.status != 200:
                    raise import_error(
                        "The website did not allow this import. Copy and paste its text instead."
                    )
                media = response.headers.get_content_type()
                if media not in {"text/html", "application/xhtml+xml", "text/plain"}:
                    raise import_error(
                        "This URL does not contain a readable webpage. Use File or paste text."
                    )
                if response.getheader("Content-Encoding", "identity").lower() != "identity":
                    raise import_error()
                length = response.getheader("Content-Length")
                if length and int(length) > MAX_BYTES:
                    raise import_error(
                        "The webpage is too large. Copy and paste a section instead."
                    )
                chunks, size = [], 0
                while True:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError()
                    if connection.sock:
                        connection.sock.settimeout(min(5, remaining))
                    chunk = response.read1(min(65536, MAX_BYTES + 1 - size))
                    if not chunk:
                        break
                    chunks.append(chunk)
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise import_error(
                            "The webpage is too large. Copy and paste a section instead."
                        )
                raw = b"".join(chunks)
                encoding = response.headers.get_content_charset() or "utf-8"
                content = raw.decode(encoding, errors="replace")
                title, text = (
                    clean_html(content) if media != "text/plain" else (host, checked_text(content))
                )
                return {"title": title or host, "content": text, "url": url}
            finally:
                connection.close()
        raise import_error("This website redirects too many times. Paste its contents instead.")
    except (OSError, TimeoutError, http.client.HTTPException, ValueError, LookupError):
        raise import_error() from None
    finally:
        SLOTS.release()
