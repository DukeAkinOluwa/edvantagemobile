import { useTheme } from "@/components/Header";
import { useGlobalStyles } from "@/styles/globalStyles";
import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "base" | "medium" | "semiLarge" | "action";
};

export function ThemedText({ style, type = "base", ...rest }: ThemedTextProps) {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();

  return (
    <Text
      style={[
        { color: theme.text },
        type === "base" ? globalStyles.baseText : undefined,
        type === "medium" ? globalStyles.mediumText : undefined,
        type === "semiLarge" ? globalStyles.semiLargeText : undefined,
        type === "action"
          ? [globalStyles.actionText2, { color: theme.text }]
          : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
