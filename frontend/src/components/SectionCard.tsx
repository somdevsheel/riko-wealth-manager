import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { colors } from '../theme/colors';

interface Props {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  tint?: 'green' | 'orange' | 'white';
}

export function SectionCard({ title, children, style, tint = 'white' }: Props) {
  const bg =
    tint === 'green' ? colors.lightGreenTint : tint === 'orange' ? colors.lightOrangeTint : colors.white;
  return (
    <Card style={[styles.card, { backgroundColor: bg }, style]} mode={tint === 'white' ? 'outlined' : 'contained'}>
      <Card.Content>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View>{children}</View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderColor: colors.border },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },
});
