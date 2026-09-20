# 🤖 AI Review System

An AI-powered, production-grade code review system that analyzes source code and provides structured, actionable feedback to help developers identify bugs, improve code quality, enforce security practices, and optimize performance.

> 🚀 **Project Status:** Production-Ready (v1.0.0) | Multi-Provider, Async-Native, Cached & Resilient | Frontend Complete

---

## 📌 Overview

The **AI Review System** is an async-native developer tool designed to automate and augment traditional code reviews.

A developer submits source code to the API, and the backend processes the request through a resilient, multi-provider review pipeline with automatic fallback, prompt injection containment, and SHA-256 hash deduplication.

The project is built with:

- **Fully Asynchronous Pipeline:** Non-blocking async event loop across all providers.
- **Multi-Provider Architecture:** Primary $\rightarrow$ Fallback cascade (Google Gemini $\rightarrow$ OpenAI/OpenRouter $\rightarrow$ Mock).
- **Specialized Review Modes:** Focused analysis for `comprehensive`, `security`, `performance`, and `style`.
- **Intelligent Deduplication:** In-memory SHA-256 hash-based TTL caching to reduce latency and API costs.
- **Built-in Resilience & Security:** Sliding-window client rate limiting, XML boundary prompt injection defense, and domain-specific HTTP status code mapping (408, 429, 502, 503).
- **Observability:** Structured JSON logging with `X-Request-ID` context propagation and health diagnostics.

---

## 💡 Key Features

### Core Review Capabilities

- 🤖 **AI-Powered Code Analysis:** Deep semantic code review with exact line-number mapping.
- 🎯 **Specialized Focus Modes:**
  - `comprehensive`: Complete balance of bugs, logic, security, and performance.
  - `security`: Dedicated audit for injection, auth flaws, and unsafe operations.
  - `performance`: Algorithmic bottlenecks, memory leaks, and blocking operations.
  - `style`: Idiomatic conventions, readability, and clean architecture.
- 🌐 **12 Supported Languages:** Python, JavaScript, TypeScript, Java, Go, Rust, C++, C, C#, PHP, Ruby, and Kotlin.
- ⚡ **Hash-Based Review Cache:** Repeated reviews of identical code and mode are served in 0ms (`cached: true`).
- 🔄 **Automated Provider Fallback:** Seamless failover to secondary providers (e.g. Gemini $\rightarrow$ Mock) if an upstream API experiences downtime.
- ⏱️ **Rich Response Metadata:** Real-time review metrics including execution time (`review_time_ms`), lines reviewed, active provider, model name, and cache flag.
- 🛡️ **Prompt Injection Defenses:** `<user_code>` XML boundary isolation and strict preambles to neutralize instruction hijacking.

### Developer Experience & Operations

- 🚦 **Sliding-Window Rate Limiting:** Configurable request caps per client IP returning HTTP 429 with `Retry-After`.
- 🩺 **Health & Diagnostics:** `GET /health` endpoint inspecting provider status, cache capacity, and supported configurations.
- 🔍 **Distributed Tracing:** Auto-generated or propagated `X-Request-ID` header across all responses and structured logs.
- 🧪 **100% Verified Backend Suite:** 32 comprehensive tests across 7 test suites validating routes, providers, cache, and edge cases.

---

## 🏗️ System Architecture

```text
                            ┌────────────────────────┐
                            │        Client          │
                            │   (Web / API Client)   │
                            └───────────┬────────────┘
                                        │ HTTP / REST (X-Request-ID)
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                            FastAPI Backend                             │
    │                                                                        │
    │  [Middleware Layer]                                                    │
    │  ├── Request ID Tracing Middleware (UUID contextvars)                  │
    │  ├── Rate Limiting Middleware (Sliding Window per IP)                  │
    │  └── CORS Middleware                                                   │
    │                                                                        │
    │  [Routes Layer]                                                        │
    │  ├── GET  /health (System status, active model, cache size)            │
    │  └── POST /review (Validated with Pydantic CodeRequest)                │
    │                                                                        │
    │  [Service Layer: Reviewer Orchestrator]                                │
    │  ├── 1. Cache Lookup (SHA-256 Hash of code + lang + mode + model)      │
    │  ├── 2. Prompt Builder (XML tags & mode instructions)                  │
    │  └── 3. Provider Cascade (Primary Provider -> Fallback Provider)       │
    │                                                                        │
    │  [Providers]                                                           │
    │  ├── GeminiReviewProvider (Google GenAI)                               │
    │  ├── OpenAIReviewProvider (OpenAI / OpenRouter async)                  │
    │  └── MockReviewProvider (Offline deterministic fallback)               │
    └────────────────────────────────────────────────────────────────────────┘
```

For detailed technical diagrams and architectural decisions, see:  
👉 [Architecture Documentation](docs/ARCHITECTURE.md)

---

## 🛠️ Technology Stack

### Backend
- **Python 3.10+** (Asyncio native)
- **FastAPI 0.141+**
- **Pydantic v2 & Pydantic-Settings**
- **Uvicorn (ASGI)**
- **HTTPX** (Async HTTP client)

### AI Providers
- **Google GenAI SDK** (`gemini-2.0-flash` / `gemini-1.5-flash`)
- **OpenAI / OpenRouter** (Async REST endpoint)
- **Deterministic Mock Provider** (Offline testing and graceful fallback)

### Testing & Tooling
- **Pytest** with **AnyIO**
- **Structured JSON Logging** with ContextVars

---

## 📁 Project Structure

```text
ai-review-system/
├── backend/
│   ├── config.py                   # Pydantic BaseSettings (keys, timeouts, cache TTL, rate limits)
│   ├── exceptions.py               # Domain exceptions (408, 429, 502, 503) & FastAPI handlers
│   ├── main.py                     # App factory, middlewares, exception handlers, and routing
│   ├── models.py                   # Pydantic models (Enums, CodeRequest, ReviewResponse, Metadata)
│   ├── requirements.txt            # Pinned dependencies
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py               # GET /health system diagnostics
│   │   └── review.py               # POST /review endpoint with mode support
│   ├── services/
│   │   ├── __init__.py
│   │   ├── cache.py                # In-memory TTL SHA-256 review cache (LRU eviction)
│   │   ├── rate_limiter.py         # Sliding-window IP rate limiter
│   │   ├── reviewer.py             # Orchestrator with cache lookup & fallback cascade
│   │   └── providers/
│   │       ├── __init__.py
│   │       ├── base.py             # Abstract BaseReviewProvider
│   │       ├── gemini.py           # Async Google GenAI provider
│   │       ├── openai_provider.py  # Async OpenAI / OpenRouter provider
│   │       └── mock.py             # Deterministic mock provider
│   └── utils/
│       ├── __init__.py
│       ├── logger.py               # Structured JSON logger with request context
│       └── prompt_builder.py       # Mode prompts with XML injection guardrails
│
├── docs/
│   ├── ARCHITECTURE.md             # System architecture & component design
│   ├── DEVELOPMENT.md              # Implementation roadmap & progress
│   ├── PRD.md                      # Product requirements document
│   ├── SRS.md                      # Software requirements specification
│   ├── UI-UX.md                    # Interface & interaction design
│   └── superpowers/specs/          # Feature design specifications
│
├── test/
│   ├── test_cache.py               # Caching, TTL, and eviction tests
│   ├── test_exceptions.py          # Domain error to HTTP status code tests
│   ├── test_health.py              # Health check & X-Request-ID tests
│   ├── test_integration.py         # Fallback cascade & rate limit integration tests
│   ├── test_prompt_builder.py      # Prompt templates & injection guardrail tests
│   ├── test_rate_limiter.py        # Sliding-window rate limiter unit tests
│   └── test_review.py              # Review routes, validation, and provider tests
│
├── .env.example                    # Template for environment configuration
├── .gitignore                      # Git ignore rules
├── pyproject.toml                  # Pytest configuration
└── README.md                       # Project documentation
```

---

# 🚀 Getting Started

## Prerequisites

- Python 3.10 or later
- Git

Verify your environment:
```bash
python --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/chandan942/ai-review-system.git
cd ai-review-system
```

---

## 2. Create & Activate Virtual Environment

### Windows (PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```ini
# Provider selection: "gemini", "openai", or "mock"
REVIEW_PROVIDER=gemini
# Fallback provider if primary fails: "openai", "mock", or "none"
FALLBACK_PROVIDER=mock

# Gemini settings
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# OpenAI / OpenRouter settings (Optional)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Timeouts & Cache
AI_TIMEOUT_SECONDS=30
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_RPM=30
```

> 🔒 **Security Notice:** Never commit `.env` to version control. It is ignored by `.gitignore`.

---

## 5. Run the Server

Start the API with Uvicorn:

```powershell
uvicorn backend.main:app --reload
```

The API will be available at:
- **API Base:** `http://127.0.0.1:8000/`
- **Health Diagnostics:** `http://127.0.0.1:8000/health`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

---

# 📡 API Reference

### 1. Health & Diagnostics

```http
GET /health
```

**Example Response:**
```json
{
  "status": "healthy",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "cache_size": 12,
  "supported_languages": [
    "python", "javascript", "typescript", "java", "go",
    "rust", "cpp", "c", "csharp", "php", "ruby", "kotlin"
  ],
  "supported_modes": [
    "comprehensive", "security", "performance", "style"
  ],
  "version": "1.0.0"
}
```

---

### 2. Code Review Endpoint

```http
POST /review
```

**Request Headers:**
- `Content-Type: application/json`
- `X-Request-ID: <optional-uuid>`

**Request Body:**
```json
{
  "code": "def divide(a, b):\n    return a / b",
  "language": "python",
  "mode": "security"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | Yes | Source code (1 – 15,000 chars, non-whitespace) |
| `language` | string | No | Language identifier (Default: `python`) |
| `mode` | string | No | `comprehensive`, `security`, `performance`, `style` (Default: `comprehensive`) |

**Response Body:**
```json
{
  "summary": "Review complete. 1 potential issue identified regarding division by zero.",
  "issues": [
    {
      "line": 2,
      "message": "Potential ZeroDivisionError if b is 0.",
      "severity": "High",
      "suggestion": "Add a guard check: if b == 0: raise ValueError('b cannot be zero')",
      "category": "Security"
    }
  ],
  "metadata": {
    "language": "python",
    "mode": "security",
    "lines_reviewed": 2,
    "review_time_ms": 340,
    "provider": "gemini",
    "model": "gemini-2.0-flash",
    "cached": false,
    "request_id": "c8a4df59-4d6c-4824-9b2f-7c18c7e91129"
  }
}
```

---

### 3. HTTP Error Codes

| Status Code | Reason | Cause |
|---|---|---|
| **408 Request Timeout** | AI Request Timed Out | The AI provider took longer than `AI_TIMEOUT_SECONDS` |
| **422 Unprocessable Entity** | Validation Error | Empty code, invalid language, or code > 15,000 characters |
| **429 Too Many Requests** | Rate Limit Exceeded | Exceeded `RATE_LIMIT_RPM` (includes `Retry-After` header) |
| **502 Bad Gateway** | Upstream Provider Error | The AI provider returned an unexpected API error |
| **503 Service Unavailable** | Provider Unavailable | Both primary and fallback providers failed or are misconfigured |

---

# 🧪 Testing

Run the full automated test suite:

```powershell
pytest test/ -v
```

### Test Coverage Highlights:
- `test_health.py`: Diagnostics, versions, header propagation
- `test_review.py`: Input constraints, 12 languages, 4 modes, mock engine
- `test_cache.py`: SHA-256 key hashing, TTL expiration, LRU eviction
- `test_prompt_builder.py`: Injection containment, XML boundary tags
- `test_exceptions.py`: Semantic status code mappings (408, 429, 502, 503)
- `test_rate_limiter.py`: Sliding window enforcement and IP isolation
- `test_integration.py`: Live fallback cascade and middleware throttling

---

# 🗺️ Roadmap & Progress

- [x] **Phase 1: Backend Foundation**
  - [x] Modular FastAPI architecture
  - [x] Pydantic models & validation
  - [x] CORS middleware
- [x] **Phase 2: AI Provider & Engine**
  - [x] Async Gemini GenAI integration
  - [x] Provider factory pattern
  - [x] Structured JSON schema mapping
  - [x] Offline mock reviewer
- [x] **Backend Improvements (v1.0.0)**
  - [x] Fully asynchronous pipeline (`async`/`await`)
  - [x] Rich `ReviewMetadata` in all responses
  - [x] 4 Specialized review modes (`comprehensive`, `security`, `performance`, `style`)
  - [x] 12 Supported programming languages
  - [x] Prompt injection XML guardrails
  - [x] Domain exception hierarchy (408, 429, 502, 503)
  - [x] In-memory SHA-256 hash-based TTL review cache
  - [x] Sliding-window client IP rate limiter
  - [x] Structured JSON logger & `X-Request-ID` tracing middleware
  - [x] OpenAI / OpenRouter provider integration
  - [x] Automatic primary $\rightarrow$ fallback cascade
  - [x] Detailed health diagnostics endpoint (`GET /health`)
  - [x] 32/32 tests automated test suite
- [x] **Phase 3: Frontend Interface**
  - [x] Web-based code editor
  - [x] Mode and language selector
  - [x] Real-time review feedback & line annotations
  - [x] Performance and metadata badges
- [ ] **Phase 4: Integrations & History**
  - [ ] Review history storage (PostgreSQL)
  - [ ] GitHub repository and Pull Request integration

---

# 📄 License

This project is maintained for educational and portfolio purposes.

---

# 👨‍💻 Author

**Chandan Singh**  
*AI Review System — Production-Grade Software Engineering & AI*