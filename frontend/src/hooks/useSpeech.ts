import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { useAppStore } from '../store/useAppStore';

const VOICE_LOCALE: Record<'en' | 'hi', string> = {
  en: 'en-US',
  hi: 'hi-IN',
};

const NO_HINDI_VOICE_MESSAGE = Platform.select({
  web: 'No Hindi voice found in this browser. Chrome/Edge usually have one built in — try those, or check your OS language settings.',
  android: 'No Hindi voice installed. Add one via Settings → System → Languages → Text-to-speech output → Install voice data.',
  ios: 'No Hindi voice installed. Add one via Settings → Accessibility → Spoken Content → Voices → Hindi.',
  default: 'No Hindi voice found on this device — check your system\'s text-to-speech language settings.',
});

// Voices rarely change mid-session, so look them up once and cache the result
// rather than re-querying on every speak() call.
let voicesPromise: Promise<Speech.Voice[]> | null = null;
function getVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) voicesPromise = Speech.getAvailableVoicesAsync().catch(() => []);
  return voicesPromise;
}

async function findVoiceId(localePrefix: string): Promise<string | undefined> {
  const voices = await getVoices();
  const match =
    voices.find((v) => v.language?.toLowerCase() === localePrefix.toLowerCase()) ??
    voices.find((v) => v.language?.toLowerCase().startsWith(localePrefix.slice(0, 2).toLowerCase()));
  return match?.identifier;
}

// Wraps expo-speech (on-device TTS — Web Speech API on web, native TTS on
// iOS/Android; no API key, no network call) with an `isSpeaking` lifecycle so
// the avatar's mouth animation can track real audio playback instead of just
// the network request being in flight. Speaks in the app's selected language.
//
// Setting `language: 'hi-IN'` alone doesn't guarantee a Hindi voice is used —
// if the device has none installed, most engines silently fall back to the
// default (English) voice, which can't read Devanagari script at all (it'll
// often still read embedded digits, since numeral pronunciation is frequently
// voice-independent, while the surrounding words go silent). So we explicitly
// look up and pass a matching voice identifier, and surface `noVoiceWarning`
// when none exists so the UI can tell the user why it's silent.
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noVoiceWarning, setNoVoiceWarning] = useState<string | null>(null);
  const mounted = useRef(true);
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    Speech.stop();
    setIsSpeaking(true);
    const locale = VOICE_LOCALE[language];
    const voiceId = await findVoiceId(locale);
    if (!mounted.current) return;

    if (language === 'hi' && !voiceId) {
      setNoVoiceWarning(NO_HINDI_VOICE_MESSAGE ?? null);
    } else {
      setNoVoiceWarning(null);
    }

    Speech.speak(text, {
      language: locale,
      voice: voiceId,
      pitch: 1.05,
      rate: 1.0,
      onStart: () => {
        if (mounted.current) setIsSpeaking(true);
      },
      onDone: () => {
        if (mounted.current) setIsSpeaking(false);
      },
      onStopped: () => {
        if (mounted.current) setIsSpeaking(false);
      },
      onError: () => {
        if (mounted.current) setIsSpeaking(false);
      },
    });
  }, [language]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const clearNoVoiceWarning = useCallback(() => setNoVoiceWarning(null), []);

  return { speak, stop, isSpeaking, noVoiceWarning, clearNoVoiceWarning };
}
