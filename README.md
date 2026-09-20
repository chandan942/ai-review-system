# 🤖 AI Review System

An AI-powered, production-grade code review system that analyzes source code and provides structured, actionable feedback to help developers identify bugs, improve code quality, enforce security practices, and optimize performance.

> 🚀 **Project Status:** Production-Ready (v1.0.0) | Multi-Provider, Async-Native, Cached & Resilient | Full-Stack (FastAPI + React 19)

---

## 📌 Overview

The **AI Review System** is an async-native developer tool designed to automate and augment traditional code reviews with deep semantic inspection and zero-latency caching.

A developer writes or pastes source code in the modern **React 19 / Monaco Editor** web interface or submits it to the REST API. The request is processed through a resilient, multi-provider review pipeline featuring automatic provider failover, prompt injection containment, SHA-256 hash deduplication, and sliding-window rate limiting.

### 🌟 Highlights
- **Full-Stack Architecture:** Modern React 19 frontend paired with an async Python FastAPI backend.
- **VS Code-Grade Editor:** Monaco Editor integration (`@monaco-editor/react`) with syntax highlighting for 12 languages.
- **Multi-Provider Resilience:** Primary $\rightarrow$ Fallback cascade (Google Gemini $\rightarrow$ OpenAI/OpenRouter $\rightarrow$ Deterministic Mock).
- **Specialized Review Modes:** Target specific engineering goals with `comprehensive`, `security`, `performance`, and `style` analysis.
- **Intelligent Deduplication:** In-memory SHA-256 hash-based TTL caching to serve repeated reviews instantly (0ms latency, zero API cost).
- **Hardened Security & Defenses:** Sliding-window client rate limiting (HTTP 429), XML boundary prompt injection defense, and input size constraints.
- **Observability & Tracing:** Structured JSON logging with `X-Request-ID` context propagation, health diagnostics, and Axios retry interceptors.

---

## 💡 Key Features

### Core Review Capabilities

- 🤖 **AI-Powered Code Analysis:** Deep semantic code review with exact line-number mapping.
- 🎯 **Specialized Focus Modes:**
  - `comprehensive`: Balanced assessment of bugs, logic, security, and performance.
  - `security`: Dedicated audit for injection, authentication flaws, and unsafe operations.
  - `performance`: Algorithmic bottlenecks, memory leaks, and blocking operations.
  - `style`: Idiomatic conventions, readability, and clean architecture.
- 🌐 **12 Supported Languages:** Python, JavaScript, TypeScript, Java, Go, Rust, C++, C, C#, PHP, Ruby, and Kotlin.
- ⚡ **Hash-Based Review Cache:** Repeated reviews of identical code and mode are served in 0ms (`cached: true`).
- 🔄 **Automated Provider Fallback:** Seamless failover to secondary providers (e.g. Gemini $\rightarrow$ Mock) if an upstream API experiences downtime.
- ⏱️ **Rich Response Metadata:** Real-time metrics including execution time (`review_time_ms`), lines reviewed, active provider, model name, and cache flag.
- 🛡️ **Prompt Injection Defenses:** `<user_code>` XML boundary isolation and strict preambles to neutralize instruction hijacking.

### Web Interface & Developer Experience

- 💻 **Monaco Code Editor:** Interactive code editing with line numbers, syntax highlighting, and `Ctrl+Enter` / `Cmd+Enter` review trigger.
- 📊 **Results Panel:** Metric badges, severity distribution (Critical, High, Medium, Low), and expandable issue cards.
- 🚦 **Sliding-Window Rate Limiting:** Configurable request caps per client IP returning HTTP 429 with `Retry-After`.
- 🩺 **Health & Diagnostics:** Live connectivity pill and `GET /health` endpoint inspecting provider status and cache capacity.
- 🔍 **Distributed Tracing:** Auto-generated or propagated `X-Request-ID` header across all responses and structured logs.
- 🧪 **114 Total Automated Tests:** 32 backend tests (Pytest) + 82 frontend unit and component tests (Vitest).

---

## 🏗️ System Architecture

```text
                            ┌─────────────────────────────────┐
                            │        React 19 Frontend        │
                            │   (Monaco Editor + Tailwind UI) │
                            └────────────────┬────────────────┘
                                             │ HTTP / REST (Vite Proxy /api)
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

### Frontend
- **React 19** with **TypeScript**
- **Vite 8** (Build tool & development server)
- **Monaco Editor** (`@monaco-editor/react`)
- **Tailwind CSS** (Styling & layout)
- **Axios** (HTTP client with backoff retry & tracing)
- **Vitest & React Testing Library** (82 unit tests)

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
- **Pytest** with **AnyIO** (32 backend tests)
- **Vitest** with **jsdom** (82 frontend tests)
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
│   ├── requirements.txt            # Pinned Python dependencies
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
├── frontend/
│   ├── src/
│   │   ├── components/             # Header, Editor, Results, IssueCard, Skeleton, etc.
│   │   ├── lib/                    # api.ts (Axios), constants.ts, types.ts
│   │   ├── test/                   # Unit & component test suites (82 tests)
│   │   ├── App.tsx                 # Main application shell
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Tailwind CSS styles
│   ├── package.json                # Frontend dependencies and npm scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── tsconfig.node.json          # TypeScript node configuration
│   ├── vite.config.ts              # Vite 8 config with proxy rewrite & React deduplication
│   └── vitest.config.ts            # Vitest testing configuration
│
├── docs/
│   ├── ARCHITECTURE.md             # System architecture & component design
│   ├── DEVELOPMENT.md              # Implementation roadmap & progress
│   ├── PRD.md                      # Product requirements document
│   ├── SRS.md                      # Software requirements specification
│   ├── UI-UX.md                    # Interface & interaction design
│   └── superpowers/specs/          # Feature design specifications
│
├── test/                           # Backend test suite (32 tests)
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

- **Python 3.10+**
- **Node.js 18+** and **npm 9+**
- **Git**

Verify your environment:
```bash
python --version
node --version
npm --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/chandan942/ai-review-system.git
cd ai-review-system
```

---

## 2. Backend Setup

### Virtual Environment

#### Windows (PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your desired configuration:

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

---

## 3. Frontend Setup

In a new terminal window, navigate to the `frontend/` directory and install the packages:

```bash
cd frontend
npm install
```

---

## 4. Running the Full Stack Application

### Step 1: Start the Backend (FastAPI)
From the project root (with virtual environment active):

```bash
uvicorn backend.main:app --port 8000 --reload
```
- API Base: `http://localhost:8000/`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Diagnostics: `http://localhost:8000/health`

### Step 2: Start the Frontend (Vite)
From the `frontend/` directory:

```bash
npm run dev
```
Open your browser at `http://localhost:5173` (or the port Vite assigns). The frontend dev server proxies all `/api/*` calls directly to the FastAPI backend at `http://localhost:8000/*`.

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

# 🧪 Testing Suites

### Running Backend Tests (Pytest)
```powershell
pytest test/ -v
```
- **32 tests** covering health diagnostics, review endpoints, caching, rate limiting, domain exceptions, prompt injection defense, and fallback cascades.

### Running Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
- **82 tests** covering Monaco Editor, Header, Results Panel, Issue Cards, Axios API client, retry mechanisms, accessibility, and theme toggling.

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
  - [x] Fallback cascade (Gemini $\rightarrow$ OpenAI $\rightarrow$ Mock)
- [x] **Phase 3: Frontend Interface**
  - [x] React 19 + TypeScript + Vite 8
  - [x] Monaco code editor integration with syntax highlighting
  - [x] Review modes and 12-language selector
  - [x] Interactive results dashboard with metric badges
  - [x] Responsive layout and dark theme design tokens
- [x] **Phase 4: Polish & Resilience**
  - [x] In-memory SHA-256 hash-based TTL review cache
  - [x] Sliding-window client IP rate limiter
  - [x] XML boundary prompt injection guardrails
  - [x] Request ID distributed tracing (`X-Request-ID`)
  - [x] Accessibility (ARIA live regions, keyboard shortcuts)
- [ ] **Phase 5: Integrations & History**
  - [ ] GitHub PR Webhook Integration & automatic diff review comments
  - [ ] Review history persistence (PostgreSQL / SQLite)

---

# 📄 License

This project is open-source and maintained for educational and portfolio purposes.

---

# 👨‍💻 Author

**Chandan Singh**  
*AI Review System — Production-Grade Software Engineering & AI*
