import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

const fontConfig = {
  fontFamily: 'System',
};

export const paperTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primaryGreen,
    secondary: colors.accentOrange,
    background: colors.white,
    surface: colors.white,
    surfaceVariant: colors.lightGreenTint,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    error: colors.danger,
    outline: colors.border,
  },
  roundness: 16,
};

export type AppTheme = typeof paperTheme;
