# Riko — IDBI Innovate 2026 Prototype

**AI-powered avatar wealth advisor inside the IDBI mobile app.** The conversational
avatar is named **Artha**.

## What's built and verified

- `backend/` — FastAPI service with 8 endpoints, 5 analytics engines, synthetic banking
  data persisted in Postgres, a rule-based advisor fallback, and a real local LLM+RAG
  path (Qwen2.5 via Ollama + LangChain + ChromaDB, gated behind `LLM_ENABLED`). Artha
  conversation history and generated insights are logged to MongoDB. Passing test suite.
- `frontend/` — Expo/React Native + TypeScript app: all 8 screens (login, dashboard,
  Artha avatar home, spending insights, recommendations, goals, wealth-score breakdown,
  chat), wired to live backend data with React Query + zustand, charts in
  `react-native-svg`, and on-device text-to-speech with a lip-synced avatar (via
  `expo-speech`).

## Running it

Backend first (frontend needs it running), then frontend.

### 1. Backend

**Prerequisites:** Python 3.12+, and Postgres + MongoDB running somewhere reachable.
Either install them natively or use Docker Compose — see `backend/README.md` for both
paths. Quick native-install version:

```bash
# Windows
winget install PostgreSQL.PostgreSQL.17
winget install MongoDB.Server
# macOS
brew install postgresql mongodb-community
# Linux
sudo apt install postgresql mongodb
```

Then set up and run the API:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit DATABASE_URL / MONGODB_URL if yours differ
python -m app.data.seed          # one-time: creates tables + loads the synthetic user
uvicorn app.main:app --reload
```

Verify it's up: open http://localhost:8000/docs, or:

```bash
curl -s localhost:8000/api/dashboard
```

**Optional — real LLM+RAG (Artha answers with a local model instead of rule-based
text):** install [Ollama](https://ollama.com), then:

```bash
ollama pull qwen2.5:7b-instruct
```

Set `LLM_ENABLED=1` in `backend/.env` (defaults to `0` — rule-based Artha, no LLM
dependency, always works). See `backend/README.md` for details.

### 2. Frontend

**Prerequisites:** Node.js 20+. The backend from step 1 must already be running on
`http://localhost:8000`.

```bash
cd frontend
npm install
npx expo start
```

Then:
- Press `w` to open it in a browser, **or**
- Scan the QR code with **Expo Go** on your phone (same Wi-Fi network as this machine)

**Physical device / Android emulator note:** `localhost` won't reach your dev machine
from a phone or the Android emulator. Set `EXPO_PUBLIC_API_URL` in a `frontend/.env`
file to your machine's LAN IP (e.g. `http://192.168.1.23:8000`) before running
`npx expo start` — see `frontend/src/api/client.ts` for the exact fallback rules
(Android emulator defaults to `10.0.2.2` automatically; iOS simulator and web use
`localhost` by default).

### 3. Try it

Login (mock MPIN/biometric, no real credentials) → Dashboard should show live data
(wealth score, spending, savings, insights) pulled from the backend you started in
step 1. From there: Spending Insights, Recommendations, Goals, Wealth Score, and Ask
Artha (avatar + chat) all hit real endpoints.

## Structure

```
riko (this repo, still at path wealthai_prototype/wealthai)/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/api.py
│   │   ├── core/
│   │   │   ├── service.py        # loads from Postgres, assembles engine outputs
│   │   │   ├── config.py         # settings from env / .env
│   │   │   └── db.py             # SQLAlchemy models (Postgres) + MongoDB helpers
│   │   ├── engines/              # spending, wealth_score, recommend, goals, advisor (Artha)
│   │   ├── data/
│   │   │   ├── synthetic.py      # synthetic user + transactions (swap for IDBI data)
│   │   │   └── seed.py           # one-time load into Postgres
│   │   └── schemas/models.py
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml        # api + postgres + mongo
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── screens/              # Login, Dashboard, AvatarHome, SpendingInsights,
│   │   │                         # Recommendations, GoalPlanner, WealthScore, Chat
│   │   ├── components/           # ScoreRing, TrendChart, AvatarIllustration, ChatBubble, ...
│   │   ├── api/                  # axios client + typed React Query hooks
│   │   ├── hooks/useSpeech.ts    # on-device TTS lifecycle for the talking avatar
│   │   ├── store/                # zustand stores (auth, chat)
│   │   ├── theme/                # colors, chart palette (green #00693E / orange #E87722)
│   │   └── navigation/
│   ├── App.tsx
│   ├── package.json
│   └── README.md
└── README.md
```

## Backend at a glance

| Endpoint | Returns |
|----------|---------|
| `GET /api/dashboard` | score, income, spending, savings, insights |
| `GET /api/spending` | category breakdown, trend, overspend alerts, recurring |
| `GET /api/score` | 6-factor wealth score + tips |
| `GET /api/recommendations` | SIP/FD/ETF/Gold split with "why" |
| `GET /api/goals` | goal plans + feasibility |
| `POST /api/ask` | Artha Q&A (rule-based or real LLM+RAG) |
| `POST /api/affordability` | "Can I afford X?" EMI + savings impact |

See `backend/README.md` and `frontend/README.md` for full setup details.
`CLAUDE_CODE_PROMPT.md` holds the original planning prompt this prototype was built
from (pre-dates the Postgres/Mongo persistence layer and the Riko/Artha rebrand).

## In progress

Docker Compose (`backend/docker-compose.yml`) is written for `api + postgres + mongo`
but not yet verified end-to-end in this environment — local development currently runs
Postgres/MongoDB as native services instead.
