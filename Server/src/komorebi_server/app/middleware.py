import json

from komorebi_server.shared.contracts.common import new_id


class RequestBoundary:
    """Bound bodies including chunked requests; attach IDs and reject cross-origin writes."""

    def __init__(self, app, settings):
        self.app, self.settings = app, settings

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        correlation = new_id()
        scope.setdefault("state", {})["correlation_id"] = correlation
        headers = dict(scope["headers"])

        async def respond(status, code, message):
            body = json.dumps(
                {"code": code, "message": message, "correlationId": correlation, "retryable": False}
            ).encode()
            await send(
                {
                    "type": "http.response.start",
                    "status": status,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"x-correlation-id", correlation.encode()),
                        (b"cache-control", b"no-store"),
                    ],
                }
            )
            await send({"type": "http.response.body", "body": body})

        if scope["method"] not in {"GET", "HEAD", "OPTIONS"}:
            origin = headers.get(b"origin")
            if origin and origin.decode() not in self.settings.allowed_origins:
                return await respond(403, "origin_forbidden", "This request origin is not allowed.")
            limit = (
                self.settings.max_upload_bytes
                if scope["path"] in {"/api/v1/core/files", "/api/v1/learn/sources/file"}
                else self.settings.max_body_bytes
            )
            length = headers.get(b"content-length")
            if length:
                try:
                    too_large = int(length) > limit or int(length) < 0
                except ValueError:
                    return await respond(400, "invalid_length", "Invalid Content-Length.")
                if too_large:
                    return await respond(413, "body_too_large", "The request body is too large.")
            data = bytearray()
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                data.extend(message.get("body", b""))
                if len(data) > limit:
                    return await respond(413, "body_too_large", "The request body is too large.")
                if not message.get("more_body", False):
                    break
            original_receive = receive
            consumed = False

            async def replay():
                nonlocal consumed
                if consumed:
                    return await original_receive()
                consumed = True
                return {"type": "http.request", "body": bytes(data), "more_body": False}

            receive = replay

        async def annotated_send(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message["headers"]) + [
                    (b"x-correlation-id", correlation.encode()),
                    (b"cache-control", b"no-store"),
                    (b"x-content-type-options", b"nosniff"),
                ]
            await send(message)

        await self.app(scope, receive, annotated_send)
