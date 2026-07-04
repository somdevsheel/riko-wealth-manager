import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { TrendChart } from '../components/TrendChart';
import { colors } from '../theme/colors';
import { colorForCategory, OTHER_COLOR } from '../theme/chartPalette';
import { categoryLabel } from '../i18n/labels';
import { useTranslation } from '../i18n/useTranslation';
import { useSpending } from '../api/queries';
import type { SpendingResponse } from '../api/types';
import type { Language } from '../store/useAppStore';

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function monthLabel(monthKey: string, lang: Language): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' });
}

function buildDonutData(byCategory: Record<string, number>, lang: Language) {
  const entries = Object.entries(byCategory);
  const top = entries.slice(0, 5);
  const rest = entries.slice(5);
  const otherTotal = rest.reduce((sum, [, v]) => sum + v, 0);

  const slices = top.map(([category, value]) => ({
    value,
    color: colorForCategory(category),
    text: categoryLabel(category, lang),
  }));
  if (otherTotal > 0) {
    slices.push({ value: otherTotal, color: OTHER_COLOR, text: categoryLabel('Other', lang) });
  }
  return slices;
}

function DonutLegend({ data, lang }: { data: SpendingResponse; lang: Language }) {
  const slices = useMemo(() => buildDonutData(data.by_category, lang), [data.by_category, lang]);
  return (
    <View style={styles.legend}>
      {slices.map((s) => (
        <View key={s.text} style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: s.color }]} />
          <Text style={styles.legendLabel}>{s.text}</Text>
          <Text style={styles.legendValue}>{formatInr(s.value)}</Text>
        </View>
      ))}
    </View>
  );
}

export function SpendingInsightsScreen() {
  const { data, isLoading, isError, error, refetch } = useSpending();
  const { t, language } = useTranslation();

  const trendData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.trend).map(([month, value]) => ({
      value,
      label: monthLabel(month, language),
    }));
  }, [data, language]);

  const topCategories = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.by_category)
      .slice(0, 5)
      .map(([category, amount]) => {
        const alert = data.overspending.find((o) => o.category === category);
        return { category, amount, delta_pct: alert?.delta_pct ?? null };
      });
  }, [data]);

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{t('spendingInsightsHeading')}</Text>

      <AsyncBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data ? (
          <>
            {data.overspending.length > 0 ? (
              <SectionCard tint="orange">
                <View style={styles.alertRow}>
                  <Icon source="alert-circle" size={20} color={colors.accentOrange} />
                  <Text style={styles.alertText}>
                    {categoryLabel(data.overspending[0].category, language)} {t('overspendAlert')}{' '}
                    {data.overspending[0].delta_pct}% {t('vsRecentAverage')}
                  </Text>
                </View>
              </SectionCard>
            ) : null}

            <SectionCard title={`${t('categoryBreakdown')} — ${data.month}`}>
              <View style={styles.donutRow}>
                <PieChart
                  data={buildDonutData(data.by_category, language)}
                  donut
                  radius={70}
                  innerRadius={44}
                  innerCircleColor={colors.white}
                  centerLabelComponent={() => (
                    <View style={styles.centerLabel}>
                      <Text style={styles.centerValue}>{formatInr(data.spending)}</Text>
                      <Text style={styles.centerCaption}>{t('total')}</Text>
                    </View>
                  )}
                />
                <DonutLegend data={data} lang={language} />
              </View>
            </SectionCard>

            <SectionCard title={t('sixMonthTrend')}>
              <TrendChart data={trendData} height={140} color={colors.primaryGreen} />
            </SectionCard>

            <SectionCard title={t('topCategories')}>
              {topCategories.map((c, idx) => (
                <View key={c.category} style={styles.topRow}>
                  <View style={[styles.legendDot, { backgroundColor: colorForCategory(c.category) }]} />
                  <Text style={styles.topRank}>{idx + 1}</Text>
                  <Text style={styles.topLabel}>{categoryLabel(c.category, language)}</Text>
                  <Text style={styles.topAmount}>{formatInr(c.amount)}</Text>
                  {c.delta_pct != null ? (
                    <Text style={styles.topDelta}>+{c.delta_pct}%</Text>
                  ) : null}
                </View>
              ))}
            </SectionCard>

            <SectionCard title={t('recurringExpenses')}>
              {data.recurring.length === 0 ? (
                <Text style={styles.emptyText}>{t('noRecurring')}</Text>
              ) : (
                data.recurring.map((r) => (
                  <View key={r.merchant} style={styles.recurringRow}>
                    <Text style={styles.recurringMerchant}>{r.merchant}</Text>
                    <Text style={styles.recurringAmount}>
                      {formatInr(r.avg_amount)}/mo · {r.months_seen}mo
                    </Text>
                  </View>
                ))
              )}
            </SectionCard>
          </>
        ) : null}
      </AsyncBoundary>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  centerLabel: { alignItems: 'center' },
  centerValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  centerCaption: { fontSize: 10, color: colors.muted },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 12, color: colors.text },
  legendValue: { fontSize: 12, color: colors.muted },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  topRank: { fontSize: 12, color: colors.muted, width: 14 },
  topLabel: { flex: 1, fontSize: 14, color: colors.text },
  topAmount: { fontSize: 14, fontWeight: '600', color: colors.text },
  topDelta: { fontSize: 12, color: colors.danger, marginLeft: 6 },
  emptyText: { fontSize: 13, color: colors.muted },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recurringMerchant: { fontSize: 14, color: colors.text },
  recurringAmount: { fontSize: 13, color: colors.muted },
});
