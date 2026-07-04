# Claude Code Prompt — Riko Backend (FastAPI + AI Wealth Engine)

> Paste this into Claude Code from the root of the `riko/` project folder.
> Two ways to use it:
> - **Starting fresh:** run all phases in order.
> - **Building on the provided zip** (which already contains Phases 0–2, tested):
>   read the existing `backend/` first, then start at **Phase 3**.
> Work phase by phase. Run and verify each phase before moving on.

---

## Context

I'm building **Riko**, an AI avatar wealth advisor for **IDBI Innovate 2026 (Problem
Statement 1: Digital Wealth Management)**. Riko lives inside the IDBI mobile banking app
and gives personalized, explainable wealth guidance from a customer's spending, savings
and investment behaviour. The conversational avatar is named **Artha**.

This prompt covers the **backend only** — a FastAPI service exposing analytics + AI
advisory endpoints that a React Native app consumes. A separate prompt builds the
frontend; do not build UI here.

Environment: Ubuntu (Dell G15), Python 3.12. Docker available.

## Scope boundary (keep the PoC focused)

Build ONLY digital wealth advisory logic: spending analysis, investment/savings
behaviour, wealth score, SIP/FD/ETF/Gold recommendation, goal planning, and the Artha
Q&A layer. Do NOT build core banking, trading, insurance, accounting, or multi-bank
aggregation — those are future scope.

## Tech stack (must match the hackathon deck)

- FastAPI + Python, Pydantic v2, Uvicorn
- PostgreSQL (transactions, goals, scores) + MongoDB (conversations, insights)
- LangChain + open-weight LLM (Llama / Qwen) + RAG over ChromaDB
- Pandas / scikit-learn for deterministic analytics
- Docker for reproducible local run

## Architectural rule (important)

All financial **numbers** must come from deterministic Python engines — never from the
LLM. The LLM (Artha) only **explains and converses**, grounded via RAG in the user's own
data, so it cannot hallucinate figures. Keep a rule-based fallback so the demo works even
with the LLM disabled (`LLM_ENABLED=0`).

## API contract (do not change these shapes — the frontend depends on them)

| Method | Path | Returns |
|--------|------|---------|
| GET | `/` | health check |
| GET | `/api/profile` | user profile (id, name, age, income, risk_profile, investments, emergency_fund, debt_emi) |
| GET | `/api/dashboard` | wealth_score, month, income, spending, savings, savings_rate_pct, investment_summary, goal_progress_pct, insights[] |
| GET | `/api/spending` | month, income, spending, savings, savings_rate_pct, by_category{}, trend{}, overspending[], recurring[] |
| GET | `/api/score` | score, factors{6 factors each with score + tip}, weights{} |
| GET | `/api/recommendations` | risk_profile, monthly_surplus, investable, recommendations[{instrument, monthly_amount, expected_return, why}] |
| GET | `/api/goals` | goals[{id,name,target,months,saved,progress_pct,required_monthly}], total_required_monthly, feasible, overall_progress_pct |
| POST | `/api/ask` | {question} → {question, answer, source} |
| POST | `/api/affordability` | {purchase_price, down_payment_pct?, loan_years?, loan_rate?} → emi, savings-rate impact, verdict, explanation |

## Target structure

```
backend/
  app/
    main.py              FastAPI app + CORS + router
    routes/api.py        all endpoints
    core/
      service.py         loads data, assembles engine outputs (per-user once persisted)
      config.py          settings from env
      db.py              Postgres + Mongo connections
    engines/
      spending.py        categorization, trends, overspend, recurring
      wealth_score.py    6-factor composite (savings, discipline, investments,
                         goals, emergency fund, debt ratio) + per-factor tips
      recommend.py       risk-based SIP/FD/ETF/Gold split, each with a "why"
      goals.py           goal planning + affordability ("Can I afford X?")
      advisor.py         Artha: LLM+RAG with rule-based fallback
    rag/
      store.py           ChromaDB init + embedding of user financial context
      pipeline.py        LangChain retrieval + LLM call
    data/
      synthetic.py       synthetic user + transactions (swap for IDBI adapter)
      seed.py            load synthetic data into Postgres/Mongo
    schemas/models.py    Pydantic request/response models
  tests/                 pytest smoke + engine unit tests
  requirements.txt
  Dockerfile
  docker-compose.yml     api + postgres + mongo + chroma
  .env.example
  README.md
```

## Phases (run & verify each)

**Phase 0 — Scaffold.** Create the FastAPI project, package layout, CORS, `/` health
check, `requirements.txt`, `.env.example`. Verify `uvicorn app.main:app --reload` boots
and `/docs` loads.

**Phase 1 — Synthetic data + engines.** Build `data/synthetic.py` (a realistic salaried
persona: ~4 months of categorized transactions with a deliberate overspend spike in the
latest month) and the four deterministic engines (spending, wealth_score, recommend,
goals). Cover them with pytest unit tests. Verify scores/recommendations are sane.

**Phase 2 — API + service layer.** Wire `core/service.py` to assemble engine outputs and
expose every endpoint in the contract above, including `/api/ask` (rule-based Artha
handling the four required questions: affordability, monthly invest amount, why score is
low, SIP vs FD) and `/api/affordability`. Add smoke tests hitting each route. Verify with
`curl`/`/docs`.

**Phase 3 — Persistence.** Add Postgres (transactions, goals, wealth scores, profiles)
and MongoDB (Artha conversation history, generated insights). Add `core/db.py`,
`core/config.py`, a `data/seed.py` that loads the synthetic dataset, and a
`docker-compose.yml` bringing up api + postgres + mongo. Migrate `service.py` off the
in-memory `lru_cache` to read from Postgres. Keep response shapes identical. Verify the
seeded data flows through unchanged.

**Phase 4 — Real Artha (LLM + RAG).** Implement `rag/store.py` and `rag/pipeline.py`:
embed the user's financial context (profile + spending summary + score + goals) into
ChromaDB, retrieve on each question, and call an open-weight LLM (Llama or Qwen) via
LangChain with a grounded system prompt in Artha's voice. Wire it into `advisor.py`
behind `LLM_ENABLED=1`, keeping the rule-based fallback when disabled or on error. Ensure
all numeric claims still originate from the engines (the LLM phrases, it doesn't compute).
Verify Artha answers "Why is my wealth score low?" using the real retrieved context.

**Phase 5 — Harden & containerize.** Error handling, request validation, structured
logging, a `Dockerfile`, full `docker-compose up` (api + postgres + mongo + chroma),
tightened CORS, and a complete README with run instructions and the IDBI-sandbox swap
path. Ensure `pytest` is green.

## Rules

- Python type hints throughout; Pydantic v2 models for all request/response bodies.
- Never break the API contract shapes above (the frontend is built against them).
- Deterministic numbers live in engines; the LLM only explains — no hallucinated figures.
- The service must run end-to-end with `LLM_ENABLED=0` and no external model, so the demo
  never depends on a live LLM.
- `data/synthetic.py` must stay swappable for an IDBI sandbox / Account Aggregator adapter
  returning the same shape — document this in the README.
- Keep commits small and per-phase; after each phase, run it, tell me exactly how to test,
  and list what's next.

If building on the provided zip, start by reading `backend/README.md`,
`backend/app/routes/api.py`, and `backend/app/engines/`, then begin at **Phase 3**.
Otherwise start at **Phase 0**.
