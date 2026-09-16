# Development Plan & Roadmap
## AI Code Review System

**Version:** 1.0  
**Date:** 2026-09-14  
**Status:** Active  

---

## 1. Overview

This plan converts the PRD, SRS, Architecture, and UI/UX documents into an actionable roadmap. Each phase is ordered by dependency — nothing starts until its prerequisites are complete.

### Milestone Summary

| Phase | Name | Status | Est. Effort | Dependencies |
|---|---|---|---|---|
| **Phase 1** | Backend Foundation | ✅ **DONE** | — | None |
| **Phase 2** | AI Integration | 🔲 Next | 2-3 days | Phase 1 |
| **Phase 3** | Frontend | 🔲 | 3-4 days | Phase 1 (Phase 2 optional — can use mock) |
| **Phase 4** | Polish & Edge Cases | 🔲 | 2 days | Phase 2 + 3 |
| **Phase 5** | GitHub PR Integration | 🔲 | 3-4 days | Phase 2 |
| **Phase 6** | Testing & Deployment | 🔲 | 2-3 days | Phase 4 |

### Dependency Graph

```mermaid
graph LR
    P1["Phase 1<br/>Backend Foundation<br/>✅ DONE"]
    P2["Phase 2<br/>AI Integration"]
    P3["Phase 3<br/>Frontend"]
    P4["Phase 4<br/>Polish & Edge Cases"]
    P5["Phase 5<br/>GitHub PR Integration"]
    P6["Phase 6<br/>Testing & Deployment"]

    P1 --> P2
    P1 --> P3
    P2 --> P4
    P3 --> P4
    P2 --> P5
    P4 --> P6
```

> [!TIP]
> **Phase 3 (Frontend) can start in parallel with Phase 2** since the mock reviewer already works. Build the frontend against mock data, then swap in real AI.

---

## 2. Phase 1 — Backend Foundation ✅ DONE

All tasks complete. Current state:

- [x] Project structure created
- [x] Python virtual environment set up
- [x] FastAPI + Uvicorn installed
- [x] GET `/` health endpoint
- [x] POST `/review` endpoint with Pydantic models
- [x] Mock reviewer returning structured JSON
- [x] CORS middleware added
- [x] Error handling on review endpoint
- [x] Project restructured (models, routes, services)
- [x] `requirements.txt` pinned
- [x] `.gitignore` configured
- [x] First git commit

---

## 3. Phase 2 — AI Integration

**Goal:** Replace the mock reviewer with real AI-powered code analysis.

### Tasks

| # | Task | Priority | Est. |
|---|---|---|---|
| 2.1 | Create `config.py` with `pydantic-settings` for env var management | P0 | 30 min |
| 2.2 | Create `.env` file with `REVIEW_PROVIDER` and `GEMINI_API_KEY` | P0 | 10 min |
| 2.3 | Install `google-generativeai` package | P0 | 5 min |
| 2.4 | Create `services/providers/base.py` — abstract `BaseReviewProvider` | P0 | 30 min |
| 2.5 | Move mock logic to `services/providers/mock.py` | P0 | 20 min |
| 2.6 | Create `utils/prompt_builder.py` — build review prompts from code + language | P0 | 1 hr |
| 2.7 | Create `services/providers/gemini.py` — Gemini API integration | P0 | 2 hrs |
| 2.8 | Update `services/reviewer.py` to use provider factory pattern | P0 | 1 hr |
| 2.9 | Add 30-second timeout handling for AI calls | P0 | 30 min |
| 2.10 | Test with real Python, JS, and TS code samples | P0 | 1 hr |
| 2.11 | (Optional) Create `services/providers/openai_provider.py` as fallback | P2 | 1 hr |

### Definition of Done
- [ ] Submitting real code to `/review` returns AI-generated issues
- [ ] Each issue has accurate line numbers, severity, message, and suggestion
- [ ] Provider is swappable via `REVIEW_PROVIDER` env var
- [ ] Setting `REVIEW_PROVIDER=mock` still works (for testing)
- [ ] 30-second timeout returns proper error response
- [ ] API keys are in `.env`, not in code

### Prompt Engineering Notes
The review prompt should instruct the AI to return a **specific JSON schema**:
```
Analyze the following {language} code. Return a JSON object with:
- "summary": one sentence overall assessment
- "issues": array of objects, each with:
  - "line": integer line number
  - "message": what's wrong
  - "severity": "Critical" | "High" | "Medium" | "Low"
  - "suggestion": how to fix it

Rules:
- Only report genuine issues, not style nitpicks unless significant
- Be specific about line numbers
- Keep suggestions actionable and concise
- If the code is clean, return an empty issues array

Code:
```{language}
{code}
```
```

---

## 4. Phase 3 — Frontend

**Goal:** Build the web UI for code submission and results display.

### Tasks

| # | Task | Priority | Est. |
|---|---|---|---|
| 3.1 | Create `frontend/` directory with `index.html`, `style.css`, `app.js` | P0 | 30 min |
| 3.2 | Implement header with logo and tagline | P0 | 30 min |
| 3.3 | Build code editor panel (textarea with line numbers or CodeMirror) | P0 | 2 hrs |
| 3.4 | Build language selector dropdown | P0 | 30 min |
| 3.5 | Build "Review Code" submit button with Ctrl+Enter shortcut | P0 | 30 min |
| 3.6 | Build results panel — empty state | P0 | 30 min |
| 3.7 | Build results panel — loading state (skeleton cards) | P0 | 1 hr |
| 3.8 | Build results panel — summary card + severity badges | P0 | 1 hr |
| 3.9 | Build issue card component with severity color-coding | P0 | 1.5 hrs |
| 3.10 | Build results panel — error state | P0 | 30 min |
| 3.11 | Build results panel — no issues (success) state | P0 | 20 min |
| 3.12 | Connect frontend to backend via `fetch()` to POST `/review` | P0 | 1 hr |
| 3.13 | Add character count display (0/10,000) | P1 | 20 min |
| 3.14 | Add stagger fade-in animation for issue cards | P1 | 30 min |
| 3.15 | Implement responsive layout (mobile stack) | P1 | 1 hr |
| 3.16 | Mount frontend as static files in FastAPI | P0 | 20 min |
| 3.17 | Apply design tokens from UI/UX document (colors, typography, spacing) | P0 | 1 hr |
| 3.18 | Add Google Fonts (Inter, JetBrains Mono) | P0 | 10 min |

### Definition of Done
- [ ] User can paste code, select language, and click Review
- [ ] Loading state shows while waiting for response
- [ ] Results display with correct severity colors and icons
- [ ] Error state displays on API failure
- [ ] Empty state shows before first review
- [ ] Works on Chrome, Firefox, Edge (desktop)
- [ ] Responsive on tablet and mobile
- [ ] Dark theme matches the design tokens

---

## 5. Phase 4 — Polish & Edge Cases

**Goal:** Handle all edge cases, improve UX, and harden the system.

### Tasks

| # | Task | Priority | Est. |
|---|---|---|---|
| 4.1 | Add input validation on frontend (empty code, max length) | P0 | 30 min |
| 4.2 | Add input validation on backend (empty after trim, max 10K chars) | P0 | 30 min |
| 4.3 | Add `ReviewMetadata` to response (language, lines_reviewed, review_time_ms) | P1 | 30 min |
| 4.4 | Add `GET /health` endpoint with AI provider status | P1 | 20 min |
| 4.5 | Improve prompt injection guardrails in system prompt | P0 | 1 hr |
| 4.6 | Handle AI returning malformed JSON (fallback parsing) | P0 | 1 hr |
| 4.7 | Add keyboard accessibility (Tab navigation, focus rings) | P1 | 1 hr |
| 4.8 | Add `aria-live` and `role="alert"` for screen readers | P1 | 30 min |
| 4.9 | Add `prefers-reduced-motion` support | P2 | 20 min |
| 4.10 | Remove `print()` statements, add proper logging | P1 | 30 min |
| 4.11 | Remove `allow_origins=["*"]`, restrict to frontend domain | P0 | 10 min |

### Definition of Done
- [ ] Submitting empty code shows validation error (no API call)
- [ ] Submitting 15K characters shows max length error
- [ ] AI malformed response returns graceful error, not 500
- [ ] All interactive elements accessible via keyboard
- [ ] No `print()` in production code
- [ ] CORS locked to frontend origin

---

## 6. Phase 5 — GitHub PR Integration (Post-MVP)

**Goal:** Automatically review GitHub Pull Requests.

### Tasks

| # | Task | Priority | Est. |
|---|---|---|---|
| 5.1 | Research GitHub Webhooks + REST API for PR events | P1 | 1 hr |
| 5.2 | Create `POST /webhook/github` endpoint to receive PR events | P1 | 1 hr |
| 5.3 | Parse PR diff using `unidiff` library | P1 | 2 hrs |
| 5.4 | Send changed files/diffs to AI reviewer | P1 | 1 hr |
| 5.5 | Post review comments back to PR via GitHub API | P1 | 2 hrs |
| 5.6 | Add webhook secret validation (security) | P1 | 30 min |
| 5.7 | Handle large PRs (chunk into multiple reviews) | P2 | 2 hrs |
| 5.8 | Add GitHub OAuth for user connection | P2 | 2 hrs |

### Definition of Done
- [ ] Opening/updating a PR triggers an automatic review
- [ ] Review comments appear directly on the PR
- [ ] Only changed lines are reviewed (not full files)
- [ ] Webhook is validated with secret

---

## 7. Phase 6 — Testing & Deployment

**Goal:** Add tests, deploy to production, and monitor.

### Tasks

| # | Task | Priority | Est. |
|---|---|---|---|
| 6.1 | Install `pytest` + `httpx` for API testing | P0 | 10 min |
| 6.2 | Write tests for `/review` endpoint (valid input, empty, too long, bad language) | P0 | 2 hrs |
| 6.3 | Write tests for AI provider switching (mock ↔ real) | P1 | 1 hr |
| 6.4 | Write tests for prompt builder output format | P1 | 30 min |
| 6.5 | Add `Procfile` or `railway.json` for deployment | P0 | 20 min |
| 6.6 | Deploy backend to Railway/Render | P0 | 1 hr |
| 6.7 | Configure production environment variables | P0 | 20 min |
| 6.8 | Test deployed API from browser | P0 | 30 min |
| 6.9 | Set up UptimeRobot for monitoring | P2 | 20 min |
| 6.10 | Write `README.md` with setup instructions | P1 | 1 hr |

### Definition of Done
- [ ] All API tests pass
- [ ] App deployed and accessible via public URL
- [ ] Environment variables configured in hosting platform
- [ ] README has local setup + deployment instructions
- [ ] Monitoring alert set up

---

## 8. MVP Checklist

> [!IMPORTANT]
> MVP = Phase 1 + Phase 2 + Phase 3 + minimal Phase 4. The product is shippable after these are done.

- [ ] **Backend:** POST `/review` returns real AI-generated review
- [ ] **Frontend:** User can paste code, select language, submit, see results
- [ ] **Validation:** Empty code and oversized code are rejected
- [ ] **Error handling:** Timeouts and AI failures show user-friendly errors
- [ ] **Security:** API keys in `.env`, CORS restricted, no code execution
- [ ] **Accessibility:** Keyboard navigable, screen reader labels

---

## 9. Risk Register

| Risk | Phase | Mitigation | Owner |
|---|---|---|---|
| AI returns inconsistent JSON format | Phase 2 | Strict prompt + fallback JSON parser | Backend |
| Gemini API rate limited on free tier | Phase 2 | Add caching for identical code; fallback to OpenAI | Backend |
| Frontend looks broken on Safari | Phase 3 | Test on Safari; use standard CSS (no cutting-edge features) | Frontend |
| GitHub webhook delivery failures | Phase 5 | Add retry logic; log all webhook payloads | Backend |
| Deployment env vars misconfigured | Phase 6 | Document all required vars in README; add startup validation | DevOps |

---

## 10. Priorities at a Glance

```
NOW (this week):
  → Phase 2: AI Integration (swap mock for Gemini)
  → Phase 3: Frontend (can start in parallel)

NEXT (next week):
  → Phase 4: Polish & edge cases
  → Phase 6: Testing & deployment

LATER:
  → Phase 5: GitHub PR integration
```

> [!TIP]
> **Recommended order to start right now:**
> 1. `config.py` + `.env` setup (15 min)
> 2. AI provider base class (30 min)
> 3. Gemini integration (2 hrs)
> 4. Test with real code (30 min)
> 5. Start frontend while AI results are fresh in your mind
