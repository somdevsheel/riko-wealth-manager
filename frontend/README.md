# Riko — Frontend (IDBI Innovate 2026 Prototype)

Expo / React Native + TypeScript app. Talks to the FastAPI backend in `../backend/` —
start that first (see `../backend/README.md`), then run this.

## Quick start

```bash
npm install
npx expo start
```

- Press `w` to run it in a browser
- Scan the QR code with **Expo Go** on your phone (same Wi-Fi network as this machine)
- Press `a` / `i` for an Android/iOS emulator (needs Android Studio / Xcode installed)

By default the app talks to the backend at `http://localhost:8000`.

## Pointing at a different backend

`src/api/client.ts` picks a base URL automatically:

| Platform | Default base URL |
|---|---|
| Web / iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` (emulator's alias for the host machine) |
| Physical device (Expo Go) | not `localhost` — see below |

For a physical phone over Wi-Fi, `localhost` means the phone itself, not your dev
machine. Create `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://<your-machine-LAN-IP>:8000
```

Then restart `npx expo start`.

## Structure

```
frontend/
  src/
    screens/       Login, Dashboard, AvatarHome, SpendingInsights,
                    Recommendations, GoalPlanner, WealthScore, Chat
    components/     ScoreRing, TrendChart, AvatarIllustration, ChatBubble, ...
    api/            axios client (client.ts) + typed React Query hooks (queries.ts)
    hooks/          useSpeech.ts — on-device TTS lifecycle for the talking avatar
    store/          zustand stores: useAppStore (auth), useChatStore (chat thread)
    navigation/     RootNavigator (stack: Login/Main/Score/Chat) + bottom tabs
    theme/          colors, chart palette (validated categorical palette)
  App.tsx           Providers: React Query, Paper, SafeArea, NavigationContainer
```

## Notable implementation choices

- **Charts are hand-rolled on `react-native-svg`**, not `victory-native` — the brief
  allowed either, and Victory Native v41 requires Skia + Reanimated, which don't run in
  Expo Go and complicate web testing. `ScoreRing` and `TrendChart` are both plain SVG.
- **The avatar (Artha)** is an illustrated, animated SVG character (`AvatarIllustration`)
  — blinks continuously, and its mouth chatters in sync with actual on-device
  text-to-speech playback (`useSpeech`, wrapping `expo-speech`), not just the network
  request being in flight.
- **Voice has no API key or network dependency** — `expo-speech` uses the Web Speech
  API on web and native TTS (`AVSpeechSynthesizer`/`TextToSpeech`) on iOS/Android.

## Type checking

```bash
npx tsc --noEmit
```
