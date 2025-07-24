import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function SignUpPage() {
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address.");
      }

      router.push({
        pathname: "/signup2",
        params: { firstName, lastName, email },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to proceed";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const responsiveStyles = StyleSheet.create({
    input: {
      width: screenWidth - 50,
      borderWidth: 0.9,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      marginBottom: 12,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    card: {
      width: screenWidth - 20,
      padding: 15,
      borderRadius: 8,
      backgroundColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 4,
      marginBottom: 20,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: 20,
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
  });

  if (error) {
    return (
      <ThemedView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ThemedText type="base" style={{ color: theme.error }}>
          Error: {error}
        </ThemedText>
        <ThemedText type="base">
          Please check the console for details.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.primary }}
        contentContainerStyle={responsiveStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={responsiveStyles.card}>
          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            LET'S GET YOU STARTED
          </ThemedText>
          <ThemedText style={[globalStyles.semiLargeText, { marginBottom: 5 }]}>
            Create an Account
          </ThemedText>
          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            First Name
          </ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="First Name *"
            placeholderTextColor={theme.placeholder}
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading}
          />
          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            Last Name
          </ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Last Name *"
            placeholderTextColor={theme.placeholder}
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
          />
          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            Email
          </ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            keyboardType="email-address"
            placeholder="Email Address *"
            placeholderTextColor={theme.placeholder}
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={handleContinue} disabled={isLoading}>
            <ThemedView
              style={[
                globalStyles.button1,
                { marginBottom: 10 },
                isLoading && { opacity: 0.5 },
              ]}
            >
              <Pressable disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <ThemedText style={globalStyles.actionText2}>
                    Continue
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          </TouchableOpacity>
          <ThemedView
            style={[
              globalStyles.container,
              {
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              },
            ]}
          >
            <ThemedView
              style={{
                borderWidth: 0.3,
                flex: 1,
                backgroundColor: globalStyles.smallText.color,
              }}
            ></ThemedView>
            <ThemedText
              style={[globalStyles.smallText, { marginHorizontal: 5 }]}
            >
              Or
            </ThemedText>
            <ThemedView
              style={{
                borderWidth: 0.3,
                flex: 1,
                backgroundColor: globalStyles.smallText.color,
              }}
            ></ThemedView>
          </ThemedView>
          <ThemedText
            style={[
              globalStyles.smallText,
              {
                textAlign: "center",
              },
            ]}
          >
            Already have an account?{" "}
            <ThemedText
              style={[
                globalStyles.actionText,
                { fontFamily: "Montserrat-Bold" },
              ]}
              onPress={() => router.push("/login")}
            >
              LOGIN HERE
            </ThemedText>
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginVertical: 20,
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 12,
  },
});
