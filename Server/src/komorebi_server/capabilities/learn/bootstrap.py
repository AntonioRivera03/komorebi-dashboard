from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Response, UploadFile

from komorebi_server.capabilities.learn.file_jobs import (
    SourceImports,
    extract_in_process,
)
from komorebi_server.capabilities.learn.import_limits import FILE_TIMEOUT, MAX_FILE_BYTES
from komorebi_server.capabilities.learn.service import Learn
from komorebi_server.capabilities.learn.source_import import fetch_website, import_error
from komorebi_server.core.http import IdempotencyKey
from komorebi_server.core.identity import get_context
from komorebi_server.core.modules import JobHandler, Module
from komorebi_server.shared.contracts.common import Completed, RequestContext, Snapshot
from komorebi_server.shared.contracts.learn import (
    ExtractedSource,
    LearnWorkspace,
    SourceImportView,
    WebsiteSourceInput,
    WorkspaceSaved,
    WorkspaceView,
)

Context = Annotated[RequestContext, Depends(get_context)]
Revision = Annotated[int, Header(alias="If-Match", ge=0)]


def create_module(platform):
    service = Learn(platform)
    imports = SourceImports(platform)
    router = APIRouter(prefix="/api/v1/learn", tags=["learn"])

    @router.get(
        "/workspace", response_model=Snapshot[WorkspaceView], response_model_exclude_none=True
    )
    def get_workspace(ctx: Context):
        return service.get(ctx)

    @router.put("/workspace", response_model=Completed[WorkspaceSaved])
    def save_workspace(
        draft: LearnWorkspace, ctx: Context, key: IdempotencyKey, expected: Revision
    ):
        return service.save(ctx, draft, expected, key)

    @router.delete("/workspace", response_model=Completed[WorkspaceSaved])
    def delete_workspace(ctx: Context, key: IdempotencyKey, expected: Revision):
        return service.save(ctx, LearnWorkspace(), expected, key, deleting=True)

    @router.post("/sources/website", response_model=ExtractedSource)
    def website_source(body: WebsiteSourceInput, ctx: Context):
        ctx.require("learn:write")
        return fetch_website(body.url)

    @router.post(
        "/sources/file",
        response_model=ExtractedSource | SourceImportView,
        responses={
            202: {"model": SourceImportView, "description": "PDF queued for extraction and OCR"}
        },
    )
    def file_source(file: UploadFile, ctx: Context, key: IdempotencyKey, response: Response):
        ctx.require("learn:write")
        data = file.file.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise import_error("Choose a file up to 5 MB, or paste a section of its contents.")
        filename = file.filename or ""
        if Path(filename).suffix.lower() == ".pdf":
            response.status_code = 202
            return imports.create(ctx, filename, data, key)
        return extract_in_process(data, filename)

    @router.get("/sources/imports/{import_id}", response_model=SourceImportView)
    def import_status(import_id: UUID, ctx: Context):
        return imports.get(ctx, str(import_id))

    @router.delete("/sources/imports/{import_id}", status_code=204)
    def discard_import(import_id: UUID, ctx: Context):
        imports.discard(ctx, str(import_id))

    return Module(
        name="learn",
        schema="learn",
        router=router,
        provides=("learn.workspace",),
        permissions=("learn:read", "learn:write"),
        export=service.export,
        jobs={
            "learn.sourceImport.v1": JobHandler(
                imports.process,
                "learn:write",
                lease_seconds=FILE_TIMEOUT + 60,
            )
        },
        maintenance=imports.cleanup,
    )
