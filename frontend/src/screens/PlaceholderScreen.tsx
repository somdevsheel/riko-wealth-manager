import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme/colors';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Coming in a later phase</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 6 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
});
