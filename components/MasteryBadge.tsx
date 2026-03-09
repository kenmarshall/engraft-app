import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, FontWeights, Fonts, Spacing, Radii, MasteryColors, type MasteryLevel } from '@/constants/theme';
import { Strings } from '@/constants/strings';

interface MasteryBadgeProps {
  level: MasteryLevel;
  size?: 'sm' | 'md';
}

export function MasteryBadge({ level, size = 'sm' }: MasteryBadgeProps) {
  const color = MasteryColors[level];
  const label = Strings.mastery[level];

  return (
    <View style={[styles.badge, { borderColor: color }, size === 'md' && styles.badgeMd]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }, size === 'md' && styles.labelMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  labelMd: {
    fontSize: FontSizes.sm,
  },
});
