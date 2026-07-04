import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../theme/colors';
import { instrumentLabel, riskProfileLabel } from '../i18n/labels';
import { useTranslation } from '../i18n/useTranslation';
import { useRecommendations } from '../api/queries';
import type { Recommendation } from '../api/types';
import type { Language } from '../store/useAppStore';

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

const INSTRUMENT_ICON: Record<Recommendation['instrument'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  SIP: 'chart-line',
  FD: 'bank',
  ETF: 'chart-areaspline',
  Gold: 'gold',
};

function RecommendationCard({ rec, lang, t }: {
  rec: Recommendation;
  lang: Language;
  t: (key: 'expectedReturn' | 'perAnnum' | 'hideDetails' | 'whyThis') => string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon source={INSTRUMENT_ICON[rec.instrument]} size={22} color={colors.primaryGreen} />
        </View>
        <View style={styles.rowMain}>
          <Text style={styles.instrument}>{instrumentLabel(rec.instrument, lang)}</Text>
          <Text style={styles.subLine}>
            {t('expectedReturn')}: {rec.expected_return} {t('perAnnum')}
          </Text>
        </View>
        <Text style={styles.amount}>{formatInr(rec.monthly_amount)}/mo</Text>
      </View>

      <Text style={styles.whyToggle} onPress={() => setExpanded((v) => !v)}>
        {expanded ? t('hideDetails') : t('whyThis')}
      </Text>
      {expanded ? <Text style={styles.whyText}>{rec.why}</Text> : null}
    </SectionCard>
  );
}

export function RecommendationsScreen() {
  const { data, isLoading, isError, error, refetch } = useRecommendations();
  const { t, language } = useTranslation();

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{t('recommendationsHeading')}</Text>

      <AsyncBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data ? (
          <>
            <SectionCard tint="green">
              <Text style={styles.summaryLine}>
                {t('riskProfile')}:{' '}
                <Text style={styles.summaryValue}>{riskProfileLabel(data.risk_profile, language)}</Text>
              </Text>
              <Text style={styles.summaryLine}>
                {t('monthlySurplus')}: <Text style={styles.summaryValue}>{formatInr(data.monthly_surplus)}</Text>
              </Text>
              <Text style={styles.summaryLine}>
                {t('recommendedToInvest')}: <Text style={styles.summaryValue}>{formatInr(data.investable)}</Text>
              </Text>
            </SectionCard>

            {data.recommendations.length === 0 ? (
              <SectionCard>
                <Text style={styles.emptyText}>{t('noSurplus')}</Text>
              </SectionCard>
            ) : (
              data.recommendations.map((rec) => (
                <RecommendationCard key={rec.instrument} rec={rec} lang={language} t={t} />
              ))
            )}
          </>
        ) : null}
      </AsyncBoundary>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  summaryLine: { fontSize: 13, color: colors.text, marginTop: 2 },
  summaryValue: { fontWeight: '700' },
  card: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGreenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1 },
  instrument: { fontSize: 15, fontWeight: '700', color: colors.text },
  subLine: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: colors.primaryGreen },
  whyToggle: { fontSize: 13, color: colors.accentOrange, fontWeight: '600', marginTop: 8 },
  whyText: { fontSize: 13, color: colors.text, marginTop: 6, lineHeight: 18 },
});
