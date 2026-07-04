import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { AvatarIllustration } from '../components/AvatarIllustration';
import { LanguageToggle } from '../components/LanguageToggle';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScoreRing } from '../components/ScoreRing';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../theme/colors';
import { useDashboard } from '../api/queries';
import { useTranslation } from '../i18n/useTranslation';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {t('dashboardHi')}
            {data ? `, ${data.profile.name.split(' ')[0]}` : ''}
          </Text>
          <Text style={styles.subGreeting}>{t('dashboardSubGreeting')}</Text>
        </View>
        <View style={styles.headerRight}>
          <LanguageToggle />
          <AvatarIllustration size={44} />
        </View>
      </View>

      <AsyncBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data ? (
          <>
            <SectionCard tint="green">
              <View style={styles.scoreRow}>
                <ScoreRing score={data.wealth_score} size={120} label={t('wealthScoreTitle')} />
                <View style={styles.scoreSummary}>
                  <Text style={styles.month}>{data.month}</Text>
                  <Text style={styles.scoreCaption}>{t('dashboardScoreCaption')}</Text>
                  <Button
                    mode="text"
                    compact
                    onPress={() => navigation.navigate('Score')}
                    textColor={colors.primaryGreen}
                  >
                    {t('viewBreakdown')}
                  </Button>
                </View>
              </View>
            </SectionCard>

            <View style={styles.statRow}>
              <SectionCard style={styles.statCard}>
                <Text style={styles.statLabel}>{t('income')}</Text>
                <Text style={styles.statValue}>{formatInr(data.income)}</Text>
              </SectionCard>
              <SectionCard style={styles.statCard}>
                <Text style={styles.statLabel}>{t('spending')}</Text>
                <Text style={styles.statValue}>{formatInr(data.spending)}</Text>
              </SectionCard>
              <SectionCard style={styles.statCard}>
                <Text style={styles.statLabel}>{t('savings')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryGreen }]}>
                  {formatInr(data.savings)}
                </Text>
                <Text style={styles.statSub}>
                  {data.savings_rate_pct}% {t('rateSuffix')}
                </Text>
              </SectionCard>
            </View>

            <SectionCard title={t('investmentsTitle')}>
              <Text style={styles.rowText}>
                {t('existing')}: {formatInr(data.investment_summary.existing)}
              </Text>
              <Text style={styles.rowText}>
                {t('recommendedMonthly')}: {formatInr(data.investment_summary.recommended_monthly)}
              </Text>
            </SectionCard>

            <SectionCard title={t('goalProgressTitle')}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, data.goal_progress_pct)}%` },
                  ]}
                />
              </View>
              <Text style={styles.rowText}>
                {data.goal_progress_pct}% {t('overall')}
              </Text>
            </SectionCard>

            <SectionCard title={t('aiInsights')} tint="orange">
              {data.insights.map((insight, idx) => (
                <Text key={idx} style={styles.insightText}>
                  • {insight}
                </Text>
              ))}
            </SectionCard>
          </>
        ) : null}
      </AsyncBoundary>

      <Button
        mode="contained"
        icon="chat-processing"
        onPress={() => navigation.navigate('Chat')}
        style={styles.askButton}
        buttonColor={colors.accentOrange}
      >
        {t('askArtha')}
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  subGreeting: { fontSize: 13, color: colors.muted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreSummary: { flex: 1, gap: 4 },
  month: { fontSize: 13, color: colors.muted },
  scoreCaption: { fontSize: 13, color: colors.text },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.muted },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  statSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  rowText: { fontSize: 14, color: colors.text, marginTop: 2 },
  progressBarTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.lightGreenTint,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: colors.primaryGreen, borderRadius: 6 },
  insightText: { fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 18 },
  askButton: { marginTop: 4, borderRadius: 28 },
});
