import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.exceptions import RateLimitExceededError, register_exception_handlers
from backend.routes.health import router as health_router
from backend.routes.review import router as review_router
from backend.services.rate_limiter import get_rate_limiter
from backend.utils.logger import get_logger, set_current_request_id

logger = get_logger("main")

app = FastAPI(
    title="AI Code Reviewer",
    description="Production-grade AI-powered code review engine",
    version="1.0.0",
)

# 1. Register domain exception handlers
register_exception_handlers(app)


# 2. Request ID Tracing & Security Headers Middleware
class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        set_current_request_id(req_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# 3. Rate Limiting Middleware (applies to /review)
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only rate limit the POST /review endpoint
        if request.url.path == "/review" and request.method == "POST":
            # Use connection IP directly to prevent X-Forwarded-For spoofing
            client_ip = request.client.host if request.client else "127.0.0.1"
            limiter = get_rate_limiter()
            try:
                limiter.check(client_ip)
            except RateLimitExceededError as exc:
                headers = {}
                if exc.retry_after is not None:
                    headers["Retry-After"] = str(exc.retry_after)
                return JSONResponse(
                    status_code=429,
                    content={"detail": exc.message},
                    headers=headers,
                )

        return await call_next(request)


app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Register routers
app.include_router(review_router)
app.include_router(health_router)


@app.get("/")
def home():
    return {"message": "AI Code Reviewer API is running!", "version": "1.0.0"}