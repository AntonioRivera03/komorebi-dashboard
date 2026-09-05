"""FastAPI application entrypoint.

This is intentionally limited to framework setup. Capability registration and
application architecture will be added in later implementation slices.
"""

from fastapi import FastAPI

app = FastAPI(
    title="Komorebi API",
    description="Server API for the Komorebi home and life dashboard.",
    version="0.1.0",
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Report that the API process is ready to accept requests."""
    return {"status": "ok"}


def run() -> None:
    """Run the local development server."""
    import uvicorn

    uvicorn.run("komorebi_server.main:app", host="127.0.0.1", port=8000, reload=True)
