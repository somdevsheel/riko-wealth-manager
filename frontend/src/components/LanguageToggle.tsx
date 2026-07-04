import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme/colors';
import { useAppStore, type Language } from '../store/useAppStore';

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
];

export function LanguageToggle() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <View style={styles.track}>
      {OPTIONS.map((opt) => {
        const active = opt.code === language;
        return (
          <Pressable
            key={opt.code}
            onPress={() => setLanguage(opt.code)}
            style={[styles.pill, active && styles.pillActive]}
            hitSlop={6}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.lightGreenTint,
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 17,
  },
  pillActive: {
    backgroundColor: colors.primaryGreen,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.primaryGreen },
  labelActive: { color: colors.white },
});
