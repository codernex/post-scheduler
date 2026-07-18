import time
from collections import defaultdict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        # Store: client_ip -> (tokens, last_updated_time)
        self.clients = defaultdict(lambda: (float(calls_per_minute), time.time()))

    async def dispatch(self, request: Request, call_next):
        # Only apply rate limits to API routes
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        tokens, last_updated = self.clients[client_ip]

        # Calculate how many tokens to replenish
        elapsed = now - last_updated
        replenish_rate = self.calls_per_minute / 60.0
        new_tokens = tokens + elapsed * replenish_rate

        # Cap the tokens at the max calls per minute bucket size
        tokens = min(float(self.calls_per_minute), new_tokens)

        if tokens >= 1.0:
            # Consume 1 token and allow request to pass through
            self.clients[client_ip] = (tokens - 1.0, now)
            return await call_next(request)
        else:
            # Deny request since bucket is empty
            self.clients[client_ip] = (tokens, now)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."}
            )
