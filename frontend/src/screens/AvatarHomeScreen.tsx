import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Chip, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { AvatarIllustration } from '../components/AvatarIllustration';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { useAsk } from '../api/queries';
import { useSpeech } from '../hooks/useSpeech';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useChatStore } from '../store/useChatStore';
import { useTranslation } from '../i18n/useTranslation';
import { SUGGESTED_QUESTIONS, DEFAULT_GREETING } from '../i18n/prompts';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AvatarHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language } = useTranslation();
  const [question, setQuestion] = useState('');
  const [speech, setSpeech] = useState(DEFAULT_GREETING[language]);
  const addMessage = useChatStore((s) => s.addMessage);
  const ask = useAsk();
  const { speak, stop, isSpeaking, noVoiceWarning, clearNoVoiceWarning } = useSpeech();
  const voice = useVoiceInput();

  // Speak the greeting once, the first time this screen is opened in a session.
  useEffect(() => {
    speak(DEFAULT_GREETING[language]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || ask.isPending) return;
    addMessage({ role: 'user', text: trimmed });
    setQuestion('');
    ask.mutate(
      { question: trimmed },
      {
        onSuccess: (res) => {
          setSpeech(res.answer);
          addMessage({ role: 'ai', text: res.answer, source: res.source });
          speak(res.answer);
        },
        onError: () => {
          const fallback = t('adviceUnavailable');
          setSpeech(fallback);
          addMessage({ role: 'ai', text: fallback });
          speak(fallback);
        },
      },
    );
  };

  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <Text style={styles.heading}>{t('askArtha')}</Text>

      <View style={styles.avatarBlock}>
        <Pressable onPress={() => isSpeaking && stop()} hitSlop={12}>
          <AvatarIllustration size={150} speaking={ask.isPending || isSpeaking} />
        </Pressable>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{ask.isPending ? t('thinking') : speech}</Text>
        </View>
        {isSpeaking ? <Text style={styles.tapHint}>{t('tapAvatarToStop')}</Text> : null}
      </View>

      <View style={styles.chipsRow}>
        {SUGGESTED_QUESTIONS[language].map((q) => (
          <Chip key={q} style={styles.chip} onPress={() => send(q)} disabled={ask.isPending}>
            {q}
          </Chip>
        ))}
      </View>

      <Button
        mode="text"
        icon="chat-processing-outline"
        onPress={() => navigation.navigate('Chat')}
        textColor={colors.primaryGreen}
      >
        {t('openFullChat')}
      </Button>

      {voice.isListening ? <Text style={styles.tapHint}>{t('listeningTapToStop')}</Text> : null}

      <View style={styles.inputRow}>
        <IconButton
          icon={voice.isListening ? 'microphone' : 'microphone-outline'}
          mode="contained-tonal"
          containerColor={voice.isListening ? colors.accentOrange : undefined}
          iconColor={voice.isListening ? colors.white : colors.primaryGreen}
          onPress={() => (voice.isListening ? voice.stop() : voice.start(send))}
        />
        <TextInput
          mode="outlined"
          placeholder={t('typeYourQuestion')}
          value={voice.isListening ? voice.partialTranscript : question}
          onChangeText={setQuestion}
          onSubmitEditing={() => send(question)}
          editable={!voice.isListening}
          style={styles.input}
          outlineColor={colors.border}
          activeOutlineColor={colors.primaryGreen}
          dense
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor={colors.primaryGreen}
          iconColor={colors.white}
          onPress={() => send(question)}
          disabled={ask.isPending || voice.isListening || !question.trim()}
        />
      </View>

      <Snackbar visible={!!voice.error} onDismiss={voice.clearError} duration={3000}>
        {voice.error}
      </Snackbar>
      <Snackbar visible={!!noVoiceWarning} onDismiss={clearNoVoiceWarning} duration={5000}>
        {noVoiceWarning}
      </Snackbar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between' },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  avatarBlock: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  speechBubble: {
    backgroundColor: colors.lightGreenTint,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  speechText: { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 20 },
  tapHint: { fontSize: 11, color: colors.muted },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { backgroundColor: colors.lightOrangeTint },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { flex: 1, backgroundColor: colors.white },
});
