# Riko — Backend (IDBI Innovate 2026 Prototype)

AI-powered avatar wealth advisor. The conversational avatar is named **Artha**. The
rule-based advisor fallback means the demo always works even with `LLM_ENABLED=0` and
no LLM/RAG dependencies running.

## Quick start

Requires Postgres and MongoDB running (see **Persistence** below for native-install or
Docker Compose setup).

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit DATABASE_URL / MONGODB_URL if needed
python -m app.data.seed   # one-time: creates tables + loads the synthetic user
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for interactive API docs.

Run tests (auto-seeds the database if empty, see `tests/conftest.py`):

```bash
pip install pytest httpx
python -m pytest tests/ -q
```

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/profile` | Synthetic user profile |
| GET | `/api/dashboard` | Wealth score, spending, savings, insights (home screen) |
| GET | `/api/spending` | Category breakdown, trend, overspending, recurring |
| GET | `/api/score` | Wealth score with 6-factor breakdown + tips |
| GET | `/api/recommendations` | SIP/FD/ETF/Gold split with explanations |
| GET | `/api/goals` | Goal plans, required monthly, feasibility |
| POST | `/api/ask` | Free-form advisor Q&A (rule-based or LLM) |
| POST | `/api/affordability` | "Can I afford X?" EMI + savings-rate impact |

Example:

```bash
curl -s localhost:8000/api/dashboard | jq
curl -s -X POST localhost:8000/api/ask \
  -H 'content-type: application/json' \
  -d '{"question":"Can I afford a 12 lakh car?"}' | jq
```

## Structure

```
backend/
  app/
    main.py            FastAPI app + CORS
    routes/api.py      All endpoints
    core/
      service.py       Loads data from Postgres, assembles engine outputs
      config.py        Settings from env / .env (pydantic-settings)
      db.py            SQLAlchemy models (Postgres) + MongoDB helpers
    engines/
      spending.py      Categorization, trends, overspend, recurring
      wealth_score.py  6-factor composite score
      recommend.py     Risk-based SIP/FD/ETF/Gold allocation
      goals.py         Goal planning + affordability
      advisor.py       Artha: LLM+RAG hook with rule-based fallback
    data/
      synthetic.py     Synthetic user + transactions (swap for IDBI data)
      seed.py          One-time load of synthetic data into Postgres
    schemas/models.py  Pydantic request models
  tests/
    conftest.py        Auto-seeds the database before tests run
    test_smoke.py
  Dockerfile
  docker-compose.yml   api + postgres + mongo
```

## Persistence

Postgres holds the structured state (profiles, transactions, goals, and an append-only
wealth-score history log used for audit/history — the score itself is always
recomputed fresh from current transactions/goals, never read back from the log).
MongoDB holds the loosely-structured Artha conversation log and generated insight
snapshots (both written best-effort — a logging failure never breaks the API response).

**Option A — Docker Compose** (matches the original Ubuntu/Docker spec exactly):

```bash
docker compose up -d postgres mongo
python -m app.data.seed
uvicorn app.main:app --reload
# or run the API in the same compose stack:
docker compose up -d --build
```

**Option B — native installs** (no Docker/virtualization needed):

```bash
# Windows: winget install PostgreSQL.PostgreSQL.17
# Windows: winget install MongoDB.Server
# macOS:   brew install postgresql mongodb-community
# Linux:   apt install postgresql mongodb
```

Either way, set `DATABASE_URL` / `MONGODB_URL` / `MONGODB_DB` in `.env` (see
`.env.example`) to point at wherever Postgres/Mongo are actually listening, then run
`python -m app.data.seed` once.

Chroma (used by the LLM+RAG path below) stays embedded — a `PersistentClient` writing
to a local directory (`CHROMA_DIR`) — rather than a standalone server container. That
directory is a Docker volume in `docker-compose.yml`, so it persists across container
restarts without needing a separate Chroma service or an HTTP client refactor.

## Real LLM + RAG

`app/engines/advisor.py` has a working local LLM+RAG path, gated behind `LLM_ENABLED`:

1. On each question, the user's financial state (profile, spending, score, goals,
   recommendations) is embedded as a handful of short documents into a local
   ChromaDB collection (persisted to `CHROMA_DIR`, default `./chroma_store`).
2. The question retrieves the most relevant few documents, which are passed as
   grounding context to a local model via LangChain's `ChatOllama`.
3. If `LLM_ENABLED` isn't `1`, Ollama isn't reachable, or anything in the pipeline
   raises, `_llm_answer` returns `None` and `ask()` falls back to the rule-based
   responder — the demo never breaks.

Setup:

```bash
# install Ollama (https://ollama.com), then:
ollama pull qwen2.5:7b-instruct
```

```
# backend/.env
LLM_ENABLED=1
LLM_MODEL=qwen2.5:7b-instruct   # default
OLLAMA_BASE_URL=http://localhost:11434  # default
```

All financial *numbers* still come from the deterministic engines — the retrieved
context only contains numbers the engines already computed, and the prompt instructs
the model to quote them rather than recompute, so it can't hallucinate figures.

## Swapping in real components later

**Real banking data:** replace `app/data/synthetic.py` with an adapter that returns the
same shape (profile dict + transaction list) from IDBI sandbox / Account Aggregator.
Nothing else changes.
