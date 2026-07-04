import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScoreRing } from '../components/ScoreRing';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../theme/colors';
import { factorLabel } from '../i18n/labels';
import { useTranslation } from '../i18n/useTranslation';
import { useScore } from '../api/queries';
import type { ScoreFactorKey } from '../api/types';

const FACTOR_ORDER: ScoreFactorKey[] = [
  'savings_rate',
  'spending_discipline',
  'investments',
  'goal_progress',
  'emergency_fund',
  'debt_ratio',
];

function factorColor(score: number): string {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.accentOrange;
  return colors.danger;
}

export function WealthScoreScreen() {
  const { data, isLoading, isError, error, refetch } = useScore();
  const { t, language } = useTranslation();

  return (
    <ScreenContainer>
      <AsyncBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data ? (
          <>
            <View style={styles.ringWrap}>
              <ScoreRing score={data.score} size={180} strokeWidth={18} label={t('wealthScoreTitle')} />
            </View>
            <Text style={styles.caption}>{t('scoreBreakdownCaption')}</Text>

            {FACTOR_ORDER.map((key) => {
              const factor = data.factors[key];
              if (!factor) return null;
              const weightPct = Math.round(data.weights[key] * 100);
              return (
                <SectionCard key={key}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorLabel}>{factorLabel(key, language)}</Text>
                    <Text style={styles.factorScore}>{factor.score}/100</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${factor.score}%`,
                          backgroundColor: factorColor(factor.score),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weight}>
                    {t('weight')}: {weightPct}% {t('weightOfScore')}
                  </Text>
                  <Text style={styles.tip}>{factor.tip}</Text>
                </SectionCard>
              );
            })}
          </>
        ) : null}
      </AsyncBoundary>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginTop: 8 },
  caption: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  factorLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  factorScore: { fontSize: 14, fontWeight: '600', color: colors.text },
  barTrack: {
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.lightGreenTint,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  weight: { fontSize: 11, color: colors.muted, marginTop: 6 },
  tip: { fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 18 },
});
