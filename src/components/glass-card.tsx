import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { GlassView, GlassStyle } from 'expo-glass-effect';
import { Spacing } from '@/constants/theme';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  glassStyle?: GlassStyle;
  style?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, glassStyle = 'regular', ...props }) => {
  return (
    <GlassView
      style={[styles.card, style]}
      glassEffectStyle={glassStyle}
      {...props}
    >
      {children}
    </GlassView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
