import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { FontAwesome6 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { saveData } from "../utils/storage";

export default function SignUpPage() {
  const { theme } = useTheme();
  const { setUserData } = useUserData();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    password: "",
    confirmPassword: "",
    university: "",
    major: "",
    bio: "",
    level: "100",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    university: "",
    major: "",
    bio: "",
    level: "",
    general: "", // For step 5 general error
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  // Get API URL from app.json
  const apiUrl =
    Constants.expoConfig?.extra?.apiUrl || "https://edvantage.com.ng/api";

  const countries = [
    { label: "United States", value: "+1", flag: "🇺🇸" },
    { label: "United Kingdom", value: "+44", flag: "🇬🇧" },
    { label: "Nigeria", value: "+234", flag: "🇳🇬" },
    { label: "Canada", value: "+1", flag: "🇨🇦" },
  ];

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const validateStep = (step: number) => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      university: "",
      major: "",
      bio: "",
      level: "",
      general: "",
    };
    let isValid = true;

    if (step === 1 || step === 5) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required.";
        isValid = false;
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required.";
        isValid = false;
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email address.";
        isValid = false;
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required.";
        isValid = false;
      } else if (!/^\d{7,12}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 7-12 digits.";
        isValid = false;
      }
      if (!formData.password.trim()) {
        newErrors.password = "Password is required.";
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long.";
        isValid = false;
      }
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = "Confirm password is required.";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
        isValid = false;
      }
    }
    if (step === 2 || step === 5) {
      if (!formData.university.trim()) {
        newErrors.university = "Institution name is required.";
        isValid = false;
      }
    }
    if (step === 3 || step === 5) {
      if (!formData.major.trim()) {
        newErrors.major = "Academic program or major is required.";
        isValid = false;
      }
    }
    if (step === 4 || step === 5) {
      if (!formData.bio.trim()) {
        newErrors.bio = "Main objective is required.";
        isValid = false;
      }
    }
    if (step === 5) {
      if (!formData.level) {
        newErrors.level = "Academic level is required.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (!isValid) {
      console.error("Validation errors:", newErrors);
      if (step === 5) {
        // For step 5, show the first relevant error as a general message
        const firstError = Object.values(newErrors).find((error) => error);
        if (firstError) {
          newErrors.general = firstError;
        }
      }
      throw new Error("Validation failed. Please check the form.");
    }
  };

  const handleNext = async () => {
    try {
      setIsLoading(true);
      if (currentStep < 5) {
        validateStep(currentStep);
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 5) {
        validateStep(currentStep);
        const apiLevel =
          formData.level === "Postgraduate" ? "Postgraduate" : "Undergraduate";
        const requestBody = {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          university: formData.university.trim(),
          course_of_study: formData.major.trim(),
          level: apiLevel,
          phone_number: `${formData.countryCode}${formData.phoneNumber.trim()}`,
          email: formData.email.trim(),
          password: formData.password.trim(),
          password_confirmation: formData.confirmPassword.trim(),
        };

        console.log("Sending registration request:", requestBody);

        const response = await axios.post(`${apiUrl}/register`, requestBody, {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": "",
          },
        });

        console.log("Registration response:", response.status, response.data);

        if (response.status === 201) {
          await setUserData({
            firstName: formData.firstName?.trim() || undefined,
            lastName: formData.lastName?.trim() || undefined,
            email: formData.email?.trim() || undefined,
            phoneNumber: formData.phoneNumber
              ? `${formData.countryCode}${formData.phoneNumber.trim()}`
              : undefined,
            password: formData.password?.trim() || undefined,
            university: formData.university?.trim() || undefined,
            department: formData.major?.trim() || undefined,
            faculty: undefined,
            course: formData.major?.trim() || undefined,
            level: formData.level || undefined,
            gender: undefined,
            dob: undefined,
            profilePic: undefined,
            themeMode: "system" as "system" | "light" | "dark",
            major: formData.major?.trim() || undefined,
            bio: formData.bio?.trim() || undefined,
            allowNotifications: true,
            allowAlarms: true,
            privacy: {
              showOnlineStatus: true,
              showProfileToGroups: true,
              allowFriendRequests: true,
              dataCollection: true,
            },
          });
          await saveData("firstLaunch", "false");
          setCurrentStep(6);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
      let errorMessage = "Failed to proceed";
      if (axios.isAxiosError(error)) {
        console.error(
          "Registration error:",
          error.response?.status,
          error.response?.data
        );
        if (error.response?.status === 409) {
          errorMessage = "Email already registered.";
        } else if (error.response?.status === 422) {
          errorMessage =
            error.response.data.message ||
            "Validation error. Please check your inputs.";
        } else {
          errorMessage = error.response?.data.message || error.message;
        }
      } else if (error instanceof Error) {
        console.error("Validation error:", error.message);
        errorMessage = error.message;
      } else {
        console.error("Unknown error:", error);
      }
      console.error("SignUpPage error:", errorMessage);
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        university: "",
        major: "",
        bio: "",
        level: "",
        general: "",
      });
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
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      width: screenWidth - 50,
      marginBottom: 12,
    },
    countryPicker: {
      width: 50,
      borderWidth: 0.9,
      borderColor: theme.border,
      borderRadius: 6,
      backgroundColor: theme.background,
      color: theme.text,
    },
    flag: {
      width: 30,
      textAlign: "center",
      fontSize: 20,
      marginHorizontal: 5,
    },
    code: {
      width: 50,
      textAlign: "center",
      fontSize: 16,
      color: theme.text,
      marginRight: 5,
    },
    phoneInput: {
      flex: 1,
      borderWidth: 0.9,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: screenWidth - 50,
      marginBottom: 12,
    },
    passwordInput: {
      flex: 1,
      borderWidth: 0.9,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    errorText: {
      color: theme.error || "#FF0000",
      fontSize: 12,
      marginBottom: 10,
      marginTop: -10,
    },
  });

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
            {errors.firstName && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.firstName}
              </ThemedText>
            )}
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
            {errors.lastName && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.lastName}
              </ThemedText>
            )}
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
            {errors.email && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.email}
              </ThemedText>
            )}
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              Phone Number
            </ThemedText>
            <View style={responsiveStyles.phoneRow}>
              <Picker
                selectedValue={formData.countryCode}
                onValueChange={(value) => handleChange("countryCode", value)}
                style={responsiveStyles.countryPicker}
                dropdownIconColor={theme.text}
                enabled={!isLoading}
              >
                {countries.map((country) => (
                  <Picker.Item
                    key={country.value}
                    label={`${country.flag} ${country.label}`}
                    value={country.value}
                  />
                ))}
              </Picker>
              <ThemedText style={responsiveStyles.flag}>
                {countries.find((c) => c.value === formData.countryCode)?.flag}
              </ThemedText>
              <ThemedText style={responsiveStyles.code}>
                {formData.countryCode}
              </ThemedText>
              <TextInput
                style={[responsiveStyles.phoneInput, globalStyles.baseText]}
                keyboardType="phone-pad"
                placeholder="Phone Number *"
                placeholderTextColor={theme.placeholder}
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange("phoneNumber", text)}
                editable={!isLoading}
              />
            </View>
            {errors.phoneNumber && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.phoneNumber}
              </ThemedText>
            )}
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              Password
            </ThemedText>
            <View style={responsiveStyles.passwordContainer}>
              <TextInput
                style={[responsiveStyles.passwordInput, globalStyles.baseText]}
                secureTextEntry={!showPassword}
                placeholder="Password *"
                placeholderTextColor={theme.placeholder}
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 10 }}
                disabled={isLoading}
              >
                <FontAwesome6
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={theme.text}
                />
              </Pressable>
            </View>
            {errors.password && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.password}
              </ThemedText>
            )}
            <ThemedText style={[globalStyles.smallText, { marginBottom: 5 }]}>
              Confirm Password
            </ThemedText>
            <View style={responsiveStyles.passwordContainer}>
              <TextInput
                style={[responsiveStyles.passwordInput, globalStyles.baseText]}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm Password *"
                placeholderTextColor={theme.placeholder}
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ padding: 10 }}
                disabled={isLoading}
              >
                <FontAwesome6
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={theme.text}
                />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.confirmPassword}
              </ThemedText>
            )}
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
              style={[globalStyles.smallText, { textAlign: "center" }]}
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
            {errors.university && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.university}
              </ThemedText>
            )}
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
            {errors.major && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.major}
              </ThemedText>
            )}
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
            {errors.bio && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.bio}
              </ThemedText>
            )}
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
              selectedValue={formData.level}
              onValueChange={(value) => handleChange("level", value)}
              style={responsiveStyles.input1}
              dropdownIconColor="white"
              enabled={!isLoading}
            >
              {[
                { label: "100 Level", value: "100" },
                { label: "200 Level", value: "200" },
                { label: "300 Level", value: "300" },
                { label: "400 Level", value: "400" },
                { label: "500 Level", value: "500" },
                { label: "Postgraduate Level", value: "Postgraduate" },
              ].map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Picker>
            {(errors.level || errors.general) && (
              <ThemedText style={responsiveStyles.errorText}>
                {errors.level || errors.general}
              </ThemedText>
            )}
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
                    Register
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
});
