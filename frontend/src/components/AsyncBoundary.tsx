import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}

export function AsyncBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  emptyMessage,
  isEmpty,
  children,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating color={colors.primaryGreen} size="large" />
      </View>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : t('somethingWentWrong');
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('couldNotLoad')}</Text>
        <Text style={styles.errorMessage}>{message}</Text>
        {onRetry ? (
          <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
            {t('retry')}
          </Button>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorMessage}>{emptyMessage ?? t('nothingHereYet')}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    minHeight: 300,
  },
  errorTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  errorMessage: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  retryButton: { marginTop: 8, borderRadius: 12 },
});
