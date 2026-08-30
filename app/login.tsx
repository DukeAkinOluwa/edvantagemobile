import { useAuth } from "@/context/AuthContext";
import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { ALERT_TYPE, Toast } from "react-native-alert-notification";

const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.profilePic, { borderColor }]} />
  )
);

export default function LoginPage() {
  const { theme } = useTheme();
  const { userData, setUserData } = useUserData();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  // Handle Android back button to close the app
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          BackHandler.exitApp();
          return true;
        }
      );
      return () => backHandler.remove();
    }
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Basic client-side validation
      if (!email.trim() || !password.trim()) {
        throw new Error("Please fill in both email and password.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address.");
      }

      // Firebase Auth sign in
      await signIn(email.trim(), password.trim());

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Welcome back!",
        textBody: "You have logged in successfully.",
      });
      router.replace("/(tabs)");
    } catch (err: any) {
      // Map Firebase error codes to friendly messages
      let message = "Failed to log in.";
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      } else if (err?.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (err?.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: "Login Failed",
        textBody: message,
      });
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };



  const responsiveStyles = StyleSheet.create({
    scrollContainer: {
      width: screenWidth - 30,
    },
  });

  return (
    <ThemedView
      style={{
        flex: 1,
        backgroundColor: theme.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.primary }}
        contentContainerStyle={[
          styles.scrollContainer,
          responsiveStyles.scrollContainer,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.card}>
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
            style={[styles.input, globalStyles.baseText]}
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
            style={[styles.input, globalStyles.baseText]}
            secureTextEntry
            placeholder="Type in your Password *"
            placeholderTextColor={theme.placeholder}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginBottom: 15 }}
            onPress={async () => {
              if (!email) {
                setError("Please enter your email first to reset password.");
                return;
              }
              try {
                const { auth } = require("@/lib/firebase");
                const { sendPasswordResetEmail } = require("firebase/auth");
                await sendPasswordResetEmail(auth, email.trim());
                Toast.show({
                  type: ALERT_TYPE.SUCCESS,
                  title: "Success",
                  textBody: "Password reset link sent to your email.",
                });
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            <ThemedText style={{ color: theme.primary, fontSize: 13, fontWeight: "500" }}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          {error && (
            <ThemedText style={{ color: theme.error, fontSize: 13, marginBottom: 10, textAlign: "center" }}>
              {error}
            </ThemedText>
          )}

          <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
            <ThemedView style={[globalStyles.button1, { marginBottom: 10, opacity: isLoading ? 0.6 : 1 }]}>
              <ThemedText style={globalStyles.actionText2}>
                {isLoading ? "Logging in..." : "Log In"}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>

          {/* Navigate to Sign Up */}
          <TouchableOpacity
            onPress={() => router.replace("/signUpPage")}
            style={{ alignItems: "center", marginTop: 8 }}
          >
            <ThemedText style={{ fontSize: 14, color: theme.placeholder }}>
              Don't have an account?{" "}
              <ThemedText style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
                Sign Up
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 1,
  },
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
    borderRadius: 15,
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
