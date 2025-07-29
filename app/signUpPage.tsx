import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Picker from "react-native-picker-select";
import { saveData } from "../utils/storage";

export default function SignUpPage() {
  const { theme } = useTheme();
  const { setUserData } = useUserData();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    university: "",
    major: "",
    bio: "",
    level: "100",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim()
      ) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Invalid email address.");
      }
    } else if (step === 2) {
      if (!formData.university.trim()) {
        throw new Error("Please enter your institution name.");
      }
    } else if (step === 3) {
      if (!formData.major.trim()) {
        throw new Error("Please enter your academic program or major.");
      }
    } else if (step === 4) {
      if (!formData.bio.trim()) {
        throw new Error("Please enter your main objective.");
      }
    } else if (step === 5) {
      if (!formData.level) {
        throw new Error("Please select your academic level.");
      }
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim() ||
        !formData.university.trim() ||
        !formData.major.trim() ||
        !formData.bio.trim()
      ) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Invalid email address.");
      }
    }
  };

  const handleNext = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (currentStep < 5) {
        validateStep(currentStep);
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 5) {
        validateStep(currentStep);
        const newUserData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          university: formData.university.trim(),
          department: formData.university.trim(),
          faculty: undefined,
          course: formData.university.trim(),
          level: formData.level,
          gender: undefined,
          dob: undefined,
          profilePic: undefined,
          themeMode: "system" as "system" | "light" | "dark",
          major: formData.major.trim(),
          bio: formData.bio.trim(),
          allowNotifications: true,
          allowAlarms: true,
          privacy: {
            showOnlineStatus: true,
            showProfileToGroups: true,
            allowFriendRequests: true,
            dataCollection: true,
          },
        };
        await setUserData(newUserData);
        await saveData("firstLaunch", "false");
        setCurrentStep(6);
      } else {
        // Step 6: Replace navigation stack to prevent going back to signup
        router.replace("/(tabs)");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to proceed";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
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
    input1: {
      width: screenWidth - 50,
      borderWidth: 1,
      borderColor: "white",
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      marginBottom: 12,
      color: "white",
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
        {currentStep === 1 && (
          <ThemedView style={responsiveStyles.card}>
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              STEP {currentStep} OF 6
            </ThemedText>
            <ThemedText
              style={[globalStyles.semiLargeText, { marginBottom: 5 }]}
            >
              Create an Account
            </ThemedText>
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              First Name
            </ThemedText>
            <TextInput
              style={[responsiveStyles.input, globalStyles.baseText]}
              placeholder="First Name *"
              placeholderTextColor={theme.placeholder}
              value={formData.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
              editable={!isLoading}
            />
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              Last Name
            </ThemedText>
            <TextInput
              style={[responsiveStyles.input, globalStyles.baseText]}
              placeholder="Last Name *"
              placeholderTextColor={theme.placeholder}
              value={formData.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
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
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleNext} disabled={isLoading}>
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
                      Sign Up
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
        )}

        {currentStep === 2 && (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: theme.primary,
              paddingHorizontal: 10,
            }}
          >
            <ThemedText
              style={[
                globalStyles.largeText,
                { color: "white", marginBottom: 20 },
              ]}
            >
              Knowing your educational institution helps us tailor your academic
              needs
            </ThemedText>
            <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
              What is your institution name?
            </ThemedText>
            <TextInput
              style={[responsiveStyles.input, globalStyles.baseText]}
              placeholder="University/Institution *"
              placeholderTextColor={theme.placeholder}
              value={formData.university}
              onChangeText={(text) => handleChange("university", text)}
              editable={!isLoading}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: "white",
                  padding: 12,
                  borderRadius: 7,
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <ThemedText style={[{ color: theme.primary }]}>
                    Next
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevious} disabled={isLoading}>
                <ThemedText
                  style={[{ color: "white", opacity: isLoading ? 0.5 : 1 }]}
                >
                  Previous
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {currentStep === 3 && (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: theme.primary,
              paddingHorizontal: 10,
            }}
          >
            <ThemedText
              style={[
                globalStyles.largeText,
                { color: "white", marginBottom: 20 },
              ]}
            >
              Understanding your major or program allows for customized academic
              support.
            </ThemedText>
            <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
              What's your Academic Program/Major?
            </ThemedText>
            <TextInput
              style={[responsiveStyles.input, globalStyles.baseText]}
              placeholder="Enter your Academic Program/Major *"
              placeholderTextColor={theme.placeholder}
              value={formData.major}
              onChangeText={(text) => handleChange("major", text)}
              editable={!isLoading}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: "white",
                  padding: 12,
                  borderRadius: 7,
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <ThemedText style={[{ color: theme.primary }]}>
                    Next
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevious} disabled={isLoading}>
                <ThemedText
                  style={[{ color: "white", opacity: isLoading ? 0.5 : 1 }]}
                >
                  Previous
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {currentStep === 4 && (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: theme.primary,
              paddingHorizontal: 10,
            }}
          >
            <ThemedText
              style={[
                globalStyles.largeText,
                { color: "white", marginBottom: 20 },
              ]}
            >
              What's your main objective in Edvantage? Your choice here won't
              limit what you can do.
            </ThemedText>
            <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
              What's your main objective?
            </ThemedText>
            <TextInput
              style={[responsiveStyles.input, globalStyles.baseText]}
              placeholder="Enter your main objective *"
              placeholderTextColor={theme.placeholder}
              value={formData.bio}
              onChangeText={(text) => handleChange("bio", text)}
              editable={!isLoading}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: "white",
                  padding: 12,
                  borderRadius: 7,
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <ThemedText style={[{ color: theme.primary }]}>
                    Next
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevious} disabled={isLoading}>
                <ThemedText
                  style={[{ color: "white", opacity: isLoading ? 0.5 : 1 }]}
                >
                  Previous
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {currentStep === 5 && (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: theme.primary,
              paddingHorizontal: 10,
            }}
          >
            <ThemedText
              style={[
                globalStyles.largeText,
                { color: "white", marginBottom: 20 },
              ]}
            >
              Stating your academic level helps provide relevant resources.
            </ThemedText>
            <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
              What is your academic level?
            </ThemedText>
            <Picker
              value={formData.level}
              onValueChange={(value) => handleChange("level", value)}
              items={[
                { label: "100 Level", value: "100" },
                { label: "200 Level", value: "200" },
                { label: "300 Level", value: "300" },
                { label: "400 Level", value: "400" },
                { label: "500 Level", value: "500" },
                { label: "Postgraduate Level", value: "Postgraduate" },
              ]}
              style={{
                inputIOS: responsiveStyles.input1,
                inputAndroid: responsiveStyles.input1,
              }}
              disabled={isLoading}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: "white",
                  padding: 12,
                  borderRadius: 7,
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <ThemedText style={[{ color: theme.primary }]}>
                    Next
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevious} disabled={isLoading}>
                <ThemedText
                  style={[{ color: "white", opacity: isLoading ? 0.5 : 1 }]}
                >
                  Previous
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {currentStep === 6 && (
          <ThemedView
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.primary,
            }}
          >
            <ThemedText
              style={[globalStyles.xLargeText, { color: theme.text }]}
            >
              Congratulations
            </ThemedText>
            <ThemedText
              style={[
                globalStyles.semiMediumText,
                { marginTop: 10, marginBottom: 20, color: theme.text },
              ]}
            >
              You're all set
            </ThemedText>
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
                borderWidth: 1,
                borderColor: theme.text,
                opacity: isLoading ? 0.5 : 1,
              }}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <ThemedText style={[{ color: theme.text }]}>
                  Continue
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        )}
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
