import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Chip, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { ChatBubble } from '../components/ChatBubble';
import { colors } from '../theme/colors';
import { useAsk } from '../api/queries';
import { useSpeech } from '../hooks/useSpeech';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useChatStore, type ChatMessage } from '../store/useChatStore';
import { useTranslation } from '../i18n/useTranslation';
import { AFFORDABILITY_DEMO } from '../i18n/prompts';
import type { RootStackParamList } from '../navigation/types';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;

export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { t, language } = useTranslation();
  const { messages, addMessage } = useChatStore();
  const ask = useAsk();
  const { speak, stop, isSpeaking, noVoiceWarning, clearNoVoiceWarning } = useSpeech();
  const voice = useVoiceInput();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const sentInitial = useRef(false);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || ask.isPending) return;
    addMessage({ role: 'user', text: trimmed });
    setInput('');
    ask.mutate(
      { question: trimmed },
      {
        onSuccess: (res) => {
          addMessage({ role: 'ai', text: res.answer, source: res.source });
          speak(res.answer);
        },
        onError: () => {
          const fallback = t('adviceUnavailable');
          addMessage({ role: 'ai', text: fallback });
          speak(fallback);
        },
      },
    );
  };

  useEffect(() => {
    if (!sentInitial.current && route.params?.initialQuestion) {
      sentInitial.current = true;
      send(route.params.initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('askArthaAnything')}</Text>
          <Text style={styles.emptySubtitle}>{t('affordabilityDemoSubtitle')}</Text>
          <Chip
            style={styles.demoChip}
            icon="car"
            onPress={() => send(AFFORDABILITY_DEMO[language])}
            disabled={ask.isPending}
          >
            {AFFORDABILITY_DEMO[language]}
          </Chip>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => (
            <ChatBubble message={item} speaking={isSpeaking && index === messages.length - 1} />
          )}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {ask.isPending ? (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{t('arthaIsTyping')}</Text>
        </View>
      ) : isSpeaking ? (
        <View style={styles.typingRow}>
          <Text style={styles.typingText} onPress={stop}>
            {t('speakingTapToStop')}
          </Text>
        </View>
      ) : null}

      {voice.isListening ? (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{t('listeningTapToStop')}</Text>
        </View>
      ) : null}

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
          value={voice.isListening ? voice.partialTranscript : input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
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
          onPress={() => send(input)}
          disabled={ask.isPending || voice.isListening || !input.trim()}
        />
      </View>

      <Snackbar visible={!!voice.error} onDismiss={voice.clearError} duration={3000}>
        {voice.error}
      </Snackbar>
      <Snackbar visible={!!noVoiceWarning} onDismiss={clearNoVoiceWarning} duration={5000}>
        {noVoiceWarning}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  demoChip: { marginTop: 8, backgroundColor: colors.lightOrangeTint },
  list: { padding: 16, gap: 4 },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: { flex: 1, backgroundColor: colors.white },
});
