// styles/globalStyles.ts
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { borderRadius, fontSizes, spacing } from '@/styles/theme';
import { StyleSheet } from 'react-native';

export const useGlobalStyles = () => {
  const theme = useColorScheme() ?? 'light';
  const colorSet = Colors[theme];

  return StyleSheet.create({
    container: {
      padding: spacing.md,
    },
    card: {
      backgroundColor: colorSet.backgroundSecondary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    baseText: {
        fontSize: fontSizes.base,
        color: colorSet.text,
        fontFamily: 'Montserrat-Regular',
    },
    smallText: {
        fontSize: fontSizes.sm,
        color: colorSet.text,
        fontFamily: 'Montserrat-Regular',
    },
    mediumText: {
        fontSize: fontSizes.md,
        color: colorSet.text,
        fontFamily: 'Montserrat-Medium',
    },
    largeText: {
        fontSize: fontSizes.lg,
        color: colorSet.text,
        fontFamily: 'Montserrat-Bold',
    },
    xLargeText: {
        fontSize: fontSizes.xl,
        color: colorSet.text,
    },
  });
};