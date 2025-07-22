import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
const signup6 = () => {
  const router = useRouter();
  const globalStyles = useGlobalStyles();
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={globalStyles.xLargeText}>Congratulations</Text>
      <Text
        style={[
          globalStyles.semiMediumText,
          { marginTop: 10, marginBottom: 20 },
        ]}
      >
        You're all set
      </Text>
      <Image
        source={require("../assets/images/Image7.webp")}
        style={{ width: 300, height: 300, alignSelf: "center" }}
      />

      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          padding: 12,
          paddingHorizontal: 20,
          marginTop: 20,
          borderRadius: 7,
        }}
        onPress={() => router.push("/(tabs)")}
      >
        <ThemedText style={[{ color: "white" }]}>Continue</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default signup6;

const styles = StyleSheet.create({});
