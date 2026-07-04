import { useCallback, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useAppStore } from '../store/useAppStore';

const RECOGNITION_LOCALE: Record<'en' | 'hi', string> = {
  en: 'en-US',
  hi: 'hi-IN',
};

// One hook, one code path, both platforms: `expo-speech-recognition` resolves to
// the browser's native SpeechRecognition API on web (no native build needed — works
// today in `expo start --web`) and to a real native module on iOS/Android (needs a
// custom dev-client build via `expo prebuild`, since it's not in Expo Go). Listens
// in the app's selected language (English or Hindi) automatically.
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const language = useAppStore((s) => s.language);

  useSpeechRecognitionEvent('start', () => setIsListening(true));

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setPartialTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      if (transcript.trim()) onResultRef.current?.(transcript.trim());
      setPartialTranscript('');
    } else {
      setPartialTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    setPartialTranscript('');
    setError(event.message || event.error);
  });

  const start = useCallback(async (onResult: (text: string) => void) => {
    setError(null);
    onResultRef.current = onResult;
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission was denied.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: RECOGNITION_LOCALE[language],
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start voice input.');
    }
  }, [language]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { start, stop, isListening, partialTranscript, error, clearError };
}
