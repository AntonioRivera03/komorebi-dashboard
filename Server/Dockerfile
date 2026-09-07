FROM python:3.12-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng ghostscript \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY src ./src
COPY migrations ./migrations
COPY alembic.ini ./
RUN uv sync --locked --no-dev \
    && useradd --create-home --uid 10001 komorebi \
    && mkdir -p /data/files \
    && chown -R komorebi:komorebi /data \
    && ln -s /data/.env /app/.env
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER komorebi
EXPOSE 8000
CMD ["uvicorn", "komorebi_server.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
