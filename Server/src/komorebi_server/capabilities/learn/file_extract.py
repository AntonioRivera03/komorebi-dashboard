"""Disposable, resource-limited parser for uploaded source files (no stored originals)."""

import io
import json
import resource
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader

from komorebi_server.capabilities.learn.import_limits import FILE_TIMEOUT, MAX_FILE_BYTES
from komorebi_server.capabilities.learn.source_import import checked_text, clean_html, import_error
from komorebi_server.shared.contracts.common import AppError


def read_pdf(pdf):
    parts, count = [], 0
    for page in pdf.pages:
        text = page.extract_text() or ""
        count += len(text)
        if count > 200000:
            raise import_error("The PDF is too long; import a section of up to 200,000 characters.")
        parts.append(text)
    return parts


def ocr_pdf(data):
    with tempfile.TemporaryDirectory() as directory:
        source, output = Path(directory) / "input.pdf", Path(directory) / "output.pdf"
        source.write_bytes(data)
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "ocrmypdf",
                "--skip-text",
                "--output-type",
                "pdf",
                "--optimize",
                "0",
                "--jobs",
                "1",
                "--language",
                "eng",
                "--tesseract-timeout",
                str(FILE_TIMEOUT + 10),
                str(source),
                str(output),
            ],
            capture_output=True,
        )
        if result.returncode == 3:
            raise import_error(
                "OCR is unavailable. Install the server OCR dependencies or rebuild Docker."
            )
        if result.returncode:
            raise import_error(
                "OCR could not read this PDF. Try a clearer scan or paste its contents."
            )
        # Read the resulting PDF, not an OCR sidecar: sidecars omit existing text pages.
        return read_pdf(PdfReader(output))


def extract_file(data, filename):
    suffix = Path(filename).suffix.lower()
    title = Path(filename).stem[:300] or "Imported source"
    if suffix == ".pdf":
        pdf = PdfReader(io.BytesIO(data))
        if pdf.is_encrypted or len(pdf.pages) > 100:
            raise import_error("Use an unencrypted PDF with at most 100 pages.")
        parts = read_pdf(pdf)
        if any(not text.strip() for text in parts):
            recognized = ocr_pdf(data)
            if len(recognized) != len(parts):
                raise import_error(
                    "OCR could not preserve all pages. Try another PDF or paste its contents."
                )
            parts = [
                original if original.strip() else scanned
                for original, scanned in zip(parts, recognized, strict=True)
            ]
        content = checked_text("\n\n".join(parts))
    elif suffix in {".txt", ".md", ".markdown", ".html", ".htm"}:
        text = data.decode("utf-8-sig")
        if suffix in {".html", ".htm"}:
            page_title, content = clean_html(text)
            title = page_title or title
        else:
            content = checked_text(text)
    else:
        raise import_error("Choose a PDF, text, Markdown or HTML file.")
    return {"title": title, "content": content}


if __name__ == "__main__":
    pdf_input = Path(sys.argv[1]).suffix.lower() == ".pdf"
    memory = (1536 if pdf_input else 384) * 1024 * 1024
    cpu = FILE_TIMEOUT if pdf_input else 8
    resource.setrlimit(resource.RLIMIT_AS, (memory, memory))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu))
    resource.setrlimit(resource.RLIMIT_FSIZE, (256 * 1024 * 1024, 256 * 1024 * 1024))
    try:
        raw = sys.stdin.buffer.read(MAX_FILE_BYTES + 1)
        if len(raw) > MAX_FILE_BYTES:
            raise ValueError()
        print(json.dumps(extract_file(raw, sys.argv[1]), ensure_ascii=True))
    except AppError as exc:
        print(json.dumps({"error": exc.message}))
    except Exception:
        sys.exit(1)
