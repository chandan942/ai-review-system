# Design Spec: AI Review System Backend Improvements

**Date:** 2026-09-18  
**Status:** Approved for Implementation  
**Target:** `backend/`

---

## 1. Goal & Overview

Transform the existing MVP FastAPI backend into a production-grade, highly-resilient, async-native AI code review engine with:
- Fully asynchronous provider pipeline (non-blocking event loop).
- Rich response metadata (`review_time_ms`, `lines_reviewed`, `provider`, `mode`, `cached`).
- Specialized review focus modes (`comprehensive`, `security`, `performance`, `style`).
- Prompt injection defenses and robust input containment.
- Domain exception hierarchy with semantic HTTP status code mapping (408, 429, 502, 503).
- Hash-based review caching (SHA-256 deduplication) and rate limiting.
- Structured logging with `X-Request-ID` tracing middleware.
- Multi-provider architecture with automatic fallback (Gemini $\rightarrow$ OpenAI/OpenRouter $\rightarrow$ Mock).
- Comprehensive test suite with 100% route and provider test coverage.

---

## 2. Architecture & Component Design

```
backend/
├── config.py                   # Pydantic BaseSettings (keys, timeouts, cache TTL, rate limits)
├── main.py                     # App factory, middlewares (CORS, RequestID, RateLimiting), routers
├── models.py                   # Pydantic models (Enums, CodeRequest, ReviewResponse, Metadata, Health)
├── exceptions.py               # Custom domain exceptions & FastAPI exception handlers
├── routes/
│   ├── __init__.py
│   ├── health.py               # GET /health detailed diagnostics
│   └── review.py               # POST /review endpoint with mode & cache support
├── services/
│   ├── __init__.py
│   ├── cache.py                # In-memory TTL hash-based review cache
│   ├── rate_limiter.py         # Client IP sliding-window rate limiter
│   ├── reviewer.py             # Orchestrator with fallback & caching
│   └── providers/
│       ├── __init__.py
│       ├── base.py             # Async abstract base provider class
│       ├── gemini.py           # Async Google GenAI provider
│       ├── openai_provider.py  # Async OpenAI / OpenRouter provider
│       └── mock.py             # Async deterministic mock provider
└── utils/
    ├── __init__.py
    ├── logger.py               # Structured logger with request context
    └── prompt_builder.py       # Prompt templates with injection guardrails and mode instructions
```

---

## 3. Data Models & API Contracts

### 3.1 Enums & Requests
```python
class SupportedLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"
    KOTLIN = "kotlin"

class ReviewMode(str, Enum):
    COMPREHENSIVE = "comprehensive"
    SECURITY = "security"
    PERFORMANCE = "performance"
    STYLE = "style"

class IssueSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"

class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=15000)
    language: SupportedLanguage = Field(default=SupportedLanguage.PYTHON)
    mode: ReviewMode = Field(default=ReviewMode.COMPREHENSIVE)
```

### 3.2 Response Schema
```python
class ReviewIssue(BaseModel):
    line: int
    message: str
    severity: IssueSeverity
    suggestion: str
    category: Optional[str] = None

class ReviewMetadata(BaseModel):
    language: str
    mode: str
    lines_reviewed: int
    review_time_ms: int
    provider: str
    model: str
    cached: bool = False
    request_id: Optional[str] = None

class ReviewResponse(BaseModel):
    summary: str
    issues: List[ReviewIssue]
    metadata: ReviewMetadata
```

### 3.3 Health Diagnostics Schema
```python
class HealthResponse(BaseModel):
    status: str
    provider: str
    model: str
    cache_size: int
    supported_languages: List[str]
    supported_modes: List[str]
    version: str
```

---

## 4. Execution & Implementation Plan

### Phase 1: Models, Config & Async Base Provider Interface
- Update `backend/models.py` with all enums, `ReviewMetadata`, `ReviewResponse`, `HealthResponse`.
- Update `backend/config.py` with provider fallback settings, cache TTL, rate limits.
- Refactor `backend/services/providers/base.py` to `async def review_code(...)`.
- Update `MockReviewProvider` and `GeminiReviewProvider` to be asynchronous.

### Phase 2: Domain Exceptions, HTTP Handlers & Prompt Guardrails
- Create `backend/exceptions.py` with custom exceptions and exception handlers.
- Update `backend/utils/prompt_builder.py` with XML boundary tags, prompt injection safeguards, and mode-tailored prompts.

### Phase 3: Hash-Based Review Cache & Rate Limiting
- Implement `backend/services/cache.py` with SHA-256 key hashing (`code + language + mode + model`) and TTL expiration.
- Implement `backend/services/rate_limiter.py` sliding-window limiter.

### Phase 4: Structured Logging & Request Tracking Middleware
- Implement `backend/utils/logger.py`.
- Add Request ID tracing middleware in `backend/main.py`.

### Phase 5: Multi-Provider Expansion & Fallback Architecture
- Implement `backend/services/providers/openai_provider.py` (OpenAI / OpenRouter compatible).
- Update `backend/services/reviewer.py` to support primary $\rightarrow$ fallback provider cascade with cache lookup.

### Phase 6: Routes, Diagnostics & Health Endpoints
- Implement `backend/routes/health.py` (`GET /health`).
- Update `backend/routes/review.py` with full metadata computation and cache reporting.
- Wire all routes into `backend/main.py`.

### Phase 7: Automated Test Suite & Verification
- Expand test suite in `test/`:
  - `test/test_health.py` (health check & diagnostics)
  - `test/test_review.py` (modes, validation, mock reviews, metadata)
  - `test/test_cache.py` (cache hit, miss, TTL, key hashing)
  - `test/test_prompt_builder.py` (mode templates, line numbers, injection guards)
  - `test/test_exceptions.py` (custom error mapping to 408, 429, 502, etc.)
  - `test/test_rate_limiter.py` (rate limiting enforcement)
- Run pytest and fix any detected issues.
