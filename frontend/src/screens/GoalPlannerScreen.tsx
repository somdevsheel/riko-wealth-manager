import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Snackbar, Text } from 'react-native-paper';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScoreRing } from '../components/ScoreRing';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../theme/colors';
import { goalNameLabel } from '../i18n/labels';
import { useTranslation } from '../i18n/useTranslation';
import { useGoals } from '../api/queries';
import type { Goal } from '../api/types';
import type { Language } from '../store/useAppStore';

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function GoalCard({ goal, lang, t }: {
  goal: Goal;
  lang: Language;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const onTrack = goal.progress_pct >= 40;
  return (
    <SectionCard style={styles.card}>
      <View style={styles.row}>
        <ScoreRing score={goal.progress_pct} size={70} strokeWidth={8} label="" />
        <View style={styles.rowMain}>
          <Text style={styles.goalName}>{goalNameLabel(goal.id, goal.name, lang)}</Text>
          <Text style={styles.goalSub}>
            {formatInr(goal.saved)} {t('savedOf')} {formatInr(goal.target)}
          </Text>
          <Text style={styles.goalSub}>
            {goal.months} {t('monthsRemaining')}
          </Text>
        </View>
      </View>
      <View style={styles.footerRow}>
        <View style={styles.feasibilityBadge}>
          <Icon
            source={onTrack ? 'check-circle' : 'clock-alert-outline'}
            size={14}
            color={onTrack ? colors.success : colors.accentOrange}
          />
          <Text style={[styles.feasibilityText, { color: onTrack ? colors.success : colors.accentOrange }]}>
            {onTrack ? t('onTrack') : t('needsAttention')}
          </Text>
        </View>
        <Text style={styles.requiredText}>
          {t('requires')} {formatInr(goal.required_monthly)}/mo
        </Text>
      </View>
    </SectionCard>
  );
}

export function GoalPlannerScreen() {
  const { data, isLoading, isError, error, refetch } = useGoals();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { t, language } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('goalPlannerHeading')}</Text>
        <Button
          mode="text"
          icon="plus"
          compact
          textColor={colors.primaryGreen}
          onPress={() => setSnackbarVisible(true)}
        >
          {t('newGoal')}
        </Button>
      </View>

      <AsyncBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data ? (
          <>
            <SectionCard tint={data.feasible ? 'green' : 'orange'}>
              <View style={styles.summaryRow}>
                <Icon
                  source={data.feasible ? 'check-circle' : 'alert-circle'}
                  size={20}
                  color={data.feasible ? colors.success : colors.accentOrange}
                />
                <Text style={styles.summaryText}>
                  {data.feasible
                    ? `${formatInr(data.surplus_available)} ${t('goalsFeasible')}`
                    : `${t('goalsNotFeasibleNeed')} ${formatInr(data.total_required_monthly)}/mo ${t(
                        'goalsNotFeasibleHave',
                      )} ${formatInr(data.surplus_available)} ${t('goalsNotFeasibleTail')}`}
                </Text>
              </View>
              <Text style={styles.overallText}>
                {data.overall_progress_pct}% {t('overallProgress')}
              </Text>
            </SectionCard>

            {data.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} lang={language} t={t} />
            ))}
          </>
        ) : null}
      </AsyncBoundary>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2500}>
        {t('newGoalComingSoon')}
      </Snackbar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  overallText: { fontSize: 12, color: colors.muted, marginTop: 6 },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowMain: { flex: 1, gap: 2 },
  goalName: { fontSize: 15, fontWeight: '700', color: colors.text },
  goalSub: { fontSize: 12, color: colors.muted },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  feasibilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feasibilityText: { fontSize: 12, fontWeight: '600' },
  requiredText: { fontSize: 12, color: colors.text },
});
