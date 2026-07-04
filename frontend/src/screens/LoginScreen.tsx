import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AvatarIllustration } from '../components/AvatarIllustration';
import { LanguageToggle } from '../components/LanguageToggle';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.langRow}>
        <LanguageToggle />
      </View>

      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>IDBI</Text>
        </View>
        <Text style={styles.appName}>Riko</Text>
        <Text style={styles.tagline}>{t('loginTagline')}</Text>
      </View>

      <View style={styles.avatarCard}>
        <AvatarIllustration size={88} />
        <Text style={styles.avatarText}>{t('loginAvatarGreeting')}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="fingerprint"
          onPress={login}
          style={styles.loginButton}
          contentStyle={styles.loginButtonContent}
          buttonColor={colors.primaryGreen}
        >
          {t('loginButton')}
        </Button>
        <Text style={styles.disclaimer}>{t('loginDisclaimer')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  langRow: { alignItems: 'flex-end' },
  brandBlock: { alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  appName: { fontSize: 26, fontWeight: '700', color: colors.text },
  tagline: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  avatarCard: {
    backgroundColor: colors.lightGreenTint,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  avatarText: { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 20 },
  actions: { gap: 10 },
  loginButton: { borderRadius: 28 },
  loginButtonContent: { paddingVertical: 6 },
  disclaimer: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
