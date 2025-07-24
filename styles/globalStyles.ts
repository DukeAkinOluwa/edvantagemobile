import { useTheme } from "@/components/Header";
import { borderRadius, fontSizes, spacing } from "@/styles/theme";
import { StyleSheet } from "react-native";

export const useGlobalStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      padding: spacing.md,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    baseText: {
      fontSize: fontSizes.base,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    smallText: {
      fontSize: fontSizes.sm,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    semiMediumLightText: {
      fontSize: fontSizes.base,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    semiMediumText: {
      fontSize: fontSizes.base,
      color: theme.text,
      fontFamily: "Montserrat-Medium",
    },
    mediumText: {
      fontSize: fontSizes.md,
      color: theme.text,
      fontFamily: "Montserrat-Medium",
    },
    semiLargeText: {
      fontFamily: "Montserrat-SemiBold",
      fontSize: fontSizes.smlg,
      color: theme.text,
    },
    largeText: {
      fontSize: fontSizes.lg,
      color: theme.text,
      fontFamily: "Montserrat-Bold",
    },
    xLargeText: {
      fontSize: fontSizes.xl,
      color: theme.text,
    },
    actionText: {
      color: theme.primary,
    },
    actionText2: {
      color: theme.secondary,
    },
    button1: {
      backgroundColor: theme.primary,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    button2: {
      backgroundColor: theme.background,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
