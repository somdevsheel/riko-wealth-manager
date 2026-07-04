import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line as SvgLine, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { colors } from '../theme/colors';

export interface TrendPoint {
  label: string;
  value: number;
}

interface Props {
  data: TrendPoint[];
  height?: number;
  color?: string;
}

const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 4;
const GRID_SECTIONS = 4;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatShort(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return `${Math.round(value)}`;
}

// Hand-rolled SVG line+area chart. Deliberately avoids react-native-gifted-charts'
// LineChart here: its touch layer wires up legacy RN responder props directly on a
// View, which react-native-web (paired with this Expo SDK's very new RN version)
// doesn't recognize — harmless in practice, but it spams the dev console with
// "Unknown event handler property" noise on every mount.
export function TrendChart({ data, height = 160, color = colors.primaryGreen }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View style={{ height }} onLayout={onLayout}>
        <Text style={styles.emptyText}>Not enough data yet.</Text>
      </View>
    );
  }

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const plotWidth = Math.max(width - PAD_LEFT - PAD_RIGHT, 1);
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;

  const points = data.map((d, i) => ({
    x: PAD_LEFT + (data.length === 1 ? plotWidth / 2 : (plotWidth * i) / (data.length - 1)),
    y: PAD_TOP + plotHeight * (1 - d.value / max),
    label: d.label,
    value: d.value,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const floorY = (PAD_TOP + plotHeight).toFixed(1);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${floorY} L ${points[0].x.toFixed(1)} ${floorY} Z`;

  const gridLines = Array.from({ length: GRID_SECTIONS + 1 }, (_, i) => ({
    value: max - (max / GRID_SECTIONS) * i,
    y: PAD_TOP + (plotHeight / GRID_SECTIONS) * i,
  }));

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {gridLines.map((g, i) => (
            <SvgLine
              key={i}
              x1={PAD_LEFT}
              y1={g.y}
              x2={width - PAD_RIGHT}
              y2={g.y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={i === GRID_SECTIONS ? undefined : [3, 4]}
            />
          ))}

          <Path d={areaPath} fill="url(#trendFill)" stroke="none" />
          <Path d={linePath} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
          ))}
        </Svg>
      ) : null}

      {width > 0 ? (
        <>
          <View style={[styles.yAxisLabels, { top: PAD_TOP, height: plotHeight }]}>
            {gridLines.map((g, i) => (
              <Text key={i} style={styles.axisLabel}>
                {formatShort(g.value)}
              </Text>
            ))}
          </View>
          <View style={[styles.xAxisLabels, { paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT }]}>
            {points.map((p, i) => (
              <Text key={i} style={styles.axisLabel}>
                {p.label}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 16 },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    width: PAD_LEFT - 8,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  xAxisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisLabel: { fontSize: 10, color: colors.muted },
});
