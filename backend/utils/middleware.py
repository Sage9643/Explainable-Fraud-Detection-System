"""
Request ID middleware.

Generates a UUID for every incoming request, attaches it to request.state,
echoes it back as a response header, and logs entry/exit with latency - all
before the route handler runs.
"""
from __future__ import annotations

import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from utils.logger import get_logger, with_request_id

logger = get_logger("fraudlens.request")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        log = with_request_id(logger, request_id)

        start = time.monotonic()
        log.info("→ %s %s", request.method, request.url.path)

        response = await call_next(request)

        duration_ms = (time.monotonic() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        log.info("← %s %s status=%d duration_ms=%.2f", request.method, request.url.path, response.status_code, duration_ms)

        return response
