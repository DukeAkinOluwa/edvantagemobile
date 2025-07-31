import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { memo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { saveData } from "../utils/storage";

const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.profilePic, { borderColor }]} />
  )
);

export default function LoginPage() {
  const { theme } = useTheme();
  const { userData, setUserData } = useUserData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  const apiUrl =
    Constants.expoConfig?.extra?.apiUrl || "https://edvantage.com.ng";

  const handleLogin = async () => {
    try {
      setError(null);

      // Validate input fields
      if (!email.trim() || !password.trim()) {
        throw new Error("Please fill in both email and password.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address.");
      }

      // Check if input matches existing userData
      if (
        userData.email &&
        userData.password &&
        email.trim() === userData.email &&
        password.trim() === userData.password
      ) {
        // Update userData to ensure consistency and set firstLaunch to false
        await setUserData({
          ...userData,
          email: email.trim(),
          password: password.trim(),
        });
        await saveData("firstLaunch", "false");
        router.replace("/(tabs)");
        Alert.alert("Success", "Logged in successfully!");
        return;
      }

      // If no match or no userData, make API call
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (response.status === 200) {
        // Update userData with entered fields
        await setUserData({
          ...userData,
          email: email.trim(),
          password: password.trim(),
          themeMode: userData.themeMode || "system",
          allowNotifications: userData.allowNotifications ?? true,
          allowAlarms: userData.allowAlarms ?? true,
          privacy: userData.privacy || {
            showOnlineStatus: true,
            showProfileToGroups: true,
            allowFriendRequests: true,
            dataCollection: true,
          },
        });
        await saveData("firstLaunch", "false");
        router.replace("(tabs)/index");
        Alert.alert("Success", "Logged in successfully!");
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid email or password.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log in";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      console.error("Login error:", error);
    }
  };

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
            Welcome Back
          </ThemedText>
          <ThemedText style={[globalStyles.semiLargeText, { marginBottom: 5 }]}>
            Log In to your account
          </ThemedText>

          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            Email
          </ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            keyboardType="email-address"
            placeholder="Type in your Email *"
            placeholderTextColor={theme.placeholder}
            value={email}
            onChangeText={setEmail}
          />

          <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
            Password
          </ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            secureTextEntry
            placeholder="Type in your Password *"
            placeholderTextColor={theme.placeholder}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={handleLogin}>
            <ThemedView style={[globalStyles.button1, { marginBottom: 10 }]}>
              <ThemedText style={globalStyles.actionText2}>Continue</ThemedText>
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
            />
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
            />
          </ThemedView>

          <ThemedView
            style={[
              globalStyles.button1,
              { marginBottom: 10, backgroundColor: "black" },
            ]}
          >
            <Pressable>
              <ThemedText style={globalStyles.actionText2}>
                Login with GitHub
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedText style={[globalStyles.smallText, { textAlign: "center" }]}>
            New User?{" "}
            <ThemedText
              style={[
                globalStyles.actionText,
                { fontFamily: "Montserrat-Bold" },
              ]}
              onPress={() => router.push("/signUpPage")}
            >
              SIGNUP HERE
            </ThemedText>
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const responsiveStyles = StyleSheet.create({
  input: {
    width: "100%",
    borderWidth: 0.9,
    borderRadius: 6,
    padding: Platform.OS === "ios" ? 12 : 10,
    marginBottom: 12,
    fontFamily: "Montserrat-Regular",
  },
  card: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
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
  },
});

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginVertical: 20,
    textAlign: "center",
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 1,
  },
});
