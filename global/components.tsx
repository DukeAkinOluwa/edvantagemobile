import { useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { StyleSheet, TextInput } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  style?: any;
  inputStyle?: any;
  placeholderTextColor?: string;
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  style,
  inputStyle,
  placeholderTextColor,
}) => {
  const { theme } = useTheme();
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();

  const boundaryWidth = screenWidth - 10;

  return (
    <ThemedView
      style={[
        styles.searchContainer,
        { width: boundaryWidth, backgroundColor: theme.background },
        style,
      ]}
    >
      <TextInput
        placeholder="Search by title, author, or summary"
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.searchInput,
          globalStyles.smallText,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor:
              theme.backgroundSecondary || "rgba(204, 204, 204, 0.2)",
          },
          inputStyle,
        ]}
        placeholderTextColor={placeholderTextColor || theme.border}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 0,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
});
