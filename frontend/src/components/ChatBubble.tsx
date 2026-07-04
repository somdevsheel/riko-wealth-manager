import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AvatarIllustration } from './AvatarIllustration';
import { colors } from '../theme/colors';
import { sourceLabel } from '../i18n/labels';
import { useTranslation } from '../i18n/useTranslation';
import type { ChatMessage } from '../store/useChatStore';

export function ChatBubble({
  message,
  speaking = false,
}: {
  message: ChatMessage;
  speaking?: boolean;
}) {
  const { language } = useTranslation();
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAi]}>
      {!isUser ? (
        <View style={styles.avatarWrap}>
          <AvatarIllustration size={28} speaking={speaking} />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAi]}>{message.text}</Text>
        {!isUser && message.source ? (
          <Text style={styles.sourceTag}>{sourceLabel(message.source, language)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end', gap: 6 },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start' },
  avatarWrap: { marginBottom: 2 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: colors.accentOrange, borderBottomRightRadius: 4 },
  bubbleAi: {
    backgroundColor: colors.lightGreenTint,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: colors.white },
  textAi: { color: colors.text },
  sourceTag: { fontSize: 10, color: colors.muted, marginTop: 4 },
});
