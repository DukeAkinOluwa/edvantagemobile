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
    semiMediumText: {
        fontSize: fontSizes.base,
        color: colorSet.text,
        fontFamily: 'Montserrat-Medium'
    },
    mediumText: {
        fontSize: fontSizes.md,
        color: colorSet.text,
        fontFamily: 'Montserrat-Medium',
    },
    semiLargeText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: fontSizes.smlg,
        color: colorSet.text,
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
    actionText: {
        color: "#2A52BE"
    }
  });
};