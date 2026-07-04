# Claude Code Prompt — WealthAI Frontend + AI Layer

> Paste this into Claude Code from the root of the `wealthai/` folder (the one
> containing the already-built, tested `backend/`). Work in phases; run and verify
> each phase before moving on.

---

## Context

I'm building **WealthAI**, an AI avatar wealth advisor for **IDBI Innovate 2026
(Problem Statement 1: Digital Wealth Management)**. It's a React Native app that lives
inside the IDBI mobile banking app and gives personalized, explainable wealth guidance
from a user's spending, savings and investment behaviour.

**The FastAPI backend is already built, tested, and runnable** in `./backend/`. Read
`backend/README.md` and `backend/app/routes/api.py` first — do NOT rebuild the backend
or change its response shapes. Your job is the **React Native frontend** and, in the
last phase, the **real LLM+RAG layer** inside `backend/app/engines/advisor.py`.

Environment: Ubuntu (Dell G15). I have Node.js and Python 3.12. Assume Expo unless a
bare RN workflow is clearly better.

## Tech stack (must match the hackathon deck)

- React Native + TypeScript, React Navigation
- React Native Paper for UI, Victory Native (or react-native-svg) for charts
- Zustand for state, React Query (TanStack Query) for data fetching
- axios client pointing at the FastAPI backend (default `http://localhost:8000`)

## Design system

- Primary green `#00693E`, accent orange `#E87722`, light green tint `#EAF4EF`,
  light orange tint `#FDF0E5`, text `#262626`, muted `#595959`.
- Rounded cards, one clean sans font, generous spacing. Match the IDBI banking feel:
  trustworthy, uncluttered. The avatar is the recurring visual motif.

## Screens to build (8)

1. **Login / Entry** — IDBI-style branded splash, mock MPIN/biometric button that
   routes to the dashboard, an avatar teaser card.
2. **Wealth Dashboard** — score ring (from `/api/dashboard`), cards for monthly
   spending / savings / investment summary, goal progress bar, 2–3 AI insight cards,
   a floating "Ask Advisor" button.
3. **AI Avatar Home** — a large animated/illustrated avatar (use a Lottie animation or
   a static illustration with a speech bubble), suggested question chips, mic + text
   entry. Chips call `/api/ask`.
4. **Spending Insights** — category donut + 6-month trend line (from `/api/spending`),
   top-5 categories with deltas, overspend alert banner, recurring-expense list.
5. **Investment Recommendations** — cards per instrument from `/api/recommendations`,
   each with amount, expected return, and an expandable "Why this?" (the `why` field).
6. **Goal Planner** — goal cards from `/api/goals` with progress rings, required
   monthly contribution, feasibility indicator; a "+ New Goal" affordance.
7. **Wealth Score Breakdown** — big score ring + six factor bars from `/api/score`,
   each with its score and tip.
8. **AI Chat** — chat thread hitting `/api/ask`; render rich answers; keep a voice
   input button (can be a stub initially). Include a sample affordability exchange.

## Phases (run & verify each)

**Phase 0 — Wire up.** Scaffold the Expo TS app in `frontend/`, add navigation, theme,
the axios+React Query client, and a `zustand` store. Verify it builds and the dashboard
screen renders real data from the running backend (`uvicorn app.main:app --reload`).

**Phase 1 — Core read screens.** Dashboard, Spending Insights, Wealth Score,
Recommendations, Goals. Real data, real charts, no placeholders. Verify each screen.

**Phase 2 — Avatar + Chat.** Avatar Home and AI Chat screens wired to `/api/ask` and
`/api/affordability`. Include the suggested-question chips and the affordability demo.

**Phase 3 — Polish.** Login screen, loading/empty/error states, consistent spacing,
the avatar motif across screens. Make it demo-video ready.

**Phase 4 — Real LLM+RAG (backend).** Implement `_llm_answer()` in
`backend/app/engines/advisor.py`: embed the user's financial context into ChromaDB,
retrieve on each question, and call an open-weight LLM (Llama or Qwen) via LangChain
with a grounded prompt. Gate it behind `LLM_ENABLED=1` and keep the rule-based fallback
so the demo never breaks. Keep all financial *numbers* in the deterministic engines —
the LLM only explains and converses.

## Rules

- Don't change backend response shapes; if you need a new field, add an endpoint or
  extend `service.py` without breaking existing tests (`pytest backend/tests`).
- TypeScript throughout the frontend; type the API responses.
- No `localStorage`-style hacks; use zustand + React Query.
- After each phase, run the app, tell me exactly how to test it, and list what's next.
- Keep commits small and per-phase.

Start with Phase 0. Read `backend/README.md` and `backend/app/routes/api.py`, then
scaffold the frontend and confirm the dashboard renders live backend data.
