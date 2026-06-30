from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import time

request_counts = defaultdict(list)
RATE_LIMIT = 60
RATE_WINDOW = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < RATE_WINDOW]

        if len(request_counts[client_ip]) >= RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
            )

        request_counts[client_ip].append(now)
        return await call_next(request)


from fastapi.responses import JSONResponse
