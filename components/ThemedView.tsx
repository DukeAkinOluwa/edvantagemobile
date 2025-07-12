import { useTheme } from "@/components/Header";
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[{ backgroundColor: theme.background }, style]}
      {...otherProps}
    />
  );
}
