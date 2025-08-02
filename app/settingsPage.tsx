import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";

const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.profilePic, { borderColor }]} />
  )
);

export default function SettingsPage() {
  const { theme, setThemeMode } = useTheme();
  const { userData, setUserData, setIsFirstLaunch } = useUserData();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();

  const countries = [
    { label: "United States", value: "+1", flag: "🇺🇸" },
    { label: "United Kingdom", value: "+44", flag: "🇬🇧" },
    { label: "Nigeria", value: "+234", flag: "🇳🇬" },
    { label: "Canada", value: "+1", flag: "🇨🇦" },
  ];

  useEffect(() => {
    if (userData.phoneNumber) {
      const code = countries
        .map((c) => c.value)
        .sort((a, b) => b.length - a.length)
        .find((code) => userData.phoneNumber!.startsWith(code));
      if (code) {
        setCountryCode(code);
        setPhoneNumber(userData.phoneNumber.slice(code.length));
      } else {
        setPhoneNumber(userData.phoneNumber);
      }
    }
  }, [userData.phoneNumber]);

  const imageUri = useMemo(() => {
    return userData.profilePic || "https://via.placeholder.com/100";
  }, [userData.profilePic]);

  useEffect(() => {
    const validateProfilePic = async () => {
      try {
        const documentDirectory = FileSystem.documentDirectory;
        if (!documentDirectory) {
          console.warn("Document directory not available.");
          return;
        }

        if (
          userData.profilePic &&
          userData.profilePic.startsWith(documentDirectory)
        ) {
          const fileInfo = await FileSystem.getInfoAsync(userData.profilePic);
          if (!fileInfo.exists) {
            await setUserData({ profilePic: undefined });
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Profile pic validation error:", err);
        setError(`Failed to validate profile picture: ${errorMessage}`);
      }
    };
    validateProfilePic();
  }, [userData.profilePic, setUserData]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow access to your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const fileName = `profile_${Date.now()}.jpg`;

        const documentDirectory = FileSystem.documentDirectory;
        if (!documentDirectory) {
          throw new Error("Document directory is not available.");
        }

        const persistentUri = `${documentDirectory}${fileName}`;

        await FileSystem.makeDirectoryAsync(documentDirectory, {
          intermediates: true,
        });

        const sourceInfo = await FileSystem.getInfoAsync(uri);
        if (!sourceInfo.exists) {
          throw new Error("Selected image URI is invalid");
        }

        await FileSystem.moveAsync({
          from: uri,
          to: persistentUri,
        });

        const fileInfo = await FileSystem.getInfoAsync(persistentUri);
        if (!fileInfo.exists) {
          throw new Error("Failed to save profile picture");
        }

        if (
          userData.profilePic &&
          userData.profilePic.startsWith(documentDirectory)
        ) {
          try {
            await FileSystem.deleteAsync(userData.profilePic, {
              idempotent: true,
            });
          } catch (deleteError) {
            console.warn("Failed to delete old profile picture:", deleteError);
          }
        }

        await setUserData({ profilePic: persistentUri });
        Alert.alert("Success", "Profile picture updated.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to pick image: ${errorMessage}`);
      Alert.alert("Error", `Failed to pick image: ${errorMessage}`);
      console.error("Pick image error:", error);
    }
  };

  const clearProfilePic = async () => {
    try {
      const documentDirectory = FileSystem.documentDirectory;
      if (
        userData.profilePic &&
        userData.profilePic.startsWith(documentDirectory)
      ) {
        try {
          await FileSystem.deleteAsync(userData.profilePic, {
            idempotent: true,
          });
        } catch (deleteError) {
          console.warn("Failed to delete profile picture:", deleteError);
        }
      }

      await setUserData({ profilePic: undefined });
      Alert.alert("Success", "Profile picture cleared.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to clear profile picture: ${errorMessage}`);
      Alert.alert("Error", `Failed to clear profile picture: ${errorMessage}`);
      console.error("Clear profile pic error:", error);
    }
  };

  const handleDobChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDobPicker(false);
    }
    if (selected && !isNaN(selected.getTime())) {
      setUserData({ dob: selected.toISOString() });
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (
        userData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)
      ) {
        throw new Error("Invalid email address");
      }
      if (phoneNumber && !/^\d{7,12}$/.test(phoneNumber)) {
        throw new Error("Phone number must be 7-12 digits");
      }
      if (userData.password && userData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      if (userData.dob && isNaN(new Date(userData.dob).getTime())) {
        throw new Error("Invalid date of birth");
      }

      await setUserData({
        firstName: userData.firstName?.trim() || undefined,
        lastName: userData.lastName?.trim() || undefined,
        email: userData.email?.trim() || undefined,
        phoneNumber: phoneNumber
          ? `${countryCode}${phoneNumber.trim()}`
          : undefined,
        password: userData.password?.trim() || undefined,
        university: userData.university?.trim() || undefined,
        bio: userData.bio?.trim() || undefined,
        dob: userData.dob,
        gender: userData.gender?.trim() || undefined,
        profilePic: userData.profilePic,
        course: userData.course?.trim() || undefined,
        level: userData.level || undefined,
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
      const allowedThemeModes = ["system", "light", "dark"] as const;
      const themeMode = allowedThemeModes.includes(userData.themeMode as any)
        ? (userData.themeMode as "system" | "light" | "dark")
        : "system";

      setThemeMode(themeMode);
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to save settings: ${errorMessage}`);
      Alert.alert("Error", `Failed to save settings: ${errorMessage}`);
      console.error("Save settings error:", error);
    }
  };

  const togglePrivacy = (key: keyof NonNullable<typeof userData.privacy>) => {
    setUserData({
      privacy: {
        ...userData.privacy,
        [key]: !userData.privacy![key],
      },
    });
  };

  const exportData = () => {
    Alert.alert("Data Export", "Your data export has been initiated.");
  };

  const [showDobPicker, setShowDobPicker] = useState(false);

  const responsiveStyles = StyleSheet.create({
    container: {
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: 20,
      backgroundColor: theme.background,
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
    input: {
      width: screenWidth - 50,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      marginBottom: 12,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    row: {
      width: screenWidth - 50,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 10,
    },
    profilePicContainer: {
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: theme.background,
    },
    picker: {
      width: screenWidth - 50,
      height: 50,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.background,
    },
    pickerSelect: {
      inputIOS: {
        ...globalStyles.baseText,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 0.5,
        borderColor: theme.border,
        borderRadius: 6,
        color: theme.text,
        backgroundColor: theme.background,
        marginBottom: 12,
      },
      inputAndroid: {
        ...globalStyles.baseText,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 0.5,
        borderColor: theme.border,
        borderRadius: 6,
        color: theme.text,
        backgroundColor: theme.background,
        marginBottom: 12,
      },
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      width: screenWidth - 50,
      marginBottom: 12,
    },
    countryPicker: {
      width: 50,
      borderWidth: 0.5,
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
      borderWidth: 0.5,
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
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
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
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationHeader title="Settings" />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={responsiveStyles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={responsiveStyles.profilePicContainer}>
          <ProfileImage uri={imageUri} borderColor={theme.border} />
          <ThemedView
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={pickImage}>
                <ThemedText
                  type="action"
                  style={[globalStyles.baseText, globalStyles.actionText2]}
                >
                  Choose Profile Image
                </ThemedText>
              </Pressable>
            </ThemedView>
            {userData.profilePic && (
              <ThemedView
                style={{
                  backgroundColor: "#CCCCCC33",
                  height: 24,
                  width: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Pressable onPress={clearProfilePic}>
                  <FontAwesome6 name="trash" size={18} color={theme.text} />
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={responsiveStyles.card}>
          <ThemedText type="semiLarge">Profile Information</ThemedText>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="First Name"
            placeholderTextColor={theme.placeholder}
            value={userData.firstName || ""}
            onChangeText={(text) => setUserData({ firstName: text })}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Last Name"
            placeholderTextColor={theme.placeholder}
            value={userData.lastName || ""}
            onChangeText={(text) => setUserData({ lastName: text })}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            keyboardType="email-address"
            placeholder="Email Address"
            placeholderTextColor={theme.placeholder}
            value={userData.email || ""}
            onChangeText={(text) => setUserData({ email: text })}
          />
          <ThemedText type="base" style={{ marginBottom: 5 }}>
            Phone Number
          </ThemedText>
          <View style={responsiveStyles.phoneRow}>
            <Picker
              selectedValue={countryCode}
              onValueChange={(value) => setCountryCode(value)}
              style={responsiveStyles.countryPicker}
              dropdownIconColor={theme.text}
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
              {countries.find((c) => c.value === countryCode)?.flag}
            </ThemedText>
            <ThemedText style={responsiveStyles.code}>{countryCode}</ThemedText>
            <TextInput
              style={[responsiveStyles.phoneInput, globalStyles.baseText]}
              keyboardType="phone-pad"
              placeholder="Phone Number"
              placeholderTextColor={theme.placeholder}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
          <ThemedText type="base" style={{ marginBottom: 5 }}>
            Password
          </ThemedText>
          <View style={responsiveStyles.passwordContainer}>
            <TextInput
              style={[responsiveStyles.passwordInput, globalStyles.baseText]}
              secureTextEntry={!showPassword}
              placeholder="Password"
              placeholderTextColor={theme.placeholder}
              value={userData.password || ""}
              onChangeText={(text) => setUserData({ password: text })}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={{ padding: 10 }}
            >
              <FontAwesome6
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color={theme.text}
              />
            </Pressable>
          </View>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="University/Institution"
            placeholderTextColor={theme.placeholder}
            value={userData.university || ""}
            onChangeText={(text) => setUserData({ university: text })}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Department"
            placeholderTextColor={theme.placeholder}
            value={userData.course || ""}
            onChangeText={(text) => setUserData({ course: text })}
          />
          <Picker
            selectedValue={userData.level || "100"}
            onValueChange={(value) => setUserData({ level: value })}
            style={responsiveStyles.picker}
            dropdownIconColor={theme.text}
          >
            {["100", "200", "300", "400", "500", "Postgraduate"].map((lvl) => (
              <Picker.Item key={lvl} label={`${lvl} Level`} value={lvl} />
            ))}
          </Picker>
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Bio"
            placeholderTextColor={theme.placeholder}
            value={userData.bio || ""}
            onChangeText={(text) => setUserData({ bio: text })}
            multiline
          />
          <TouchableOpacity onPress={() => setShowDobPicker(true)}>
            <ThemedText style={[responsiveStyles.input, globalStyles.baseText]}>
              Date of Birth:{" "}
              {userData.dob
                ? new Date(userData.dob).toLocaleDateString()
                : "Select Date"}
            </ThemedText>
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={userData.dob ? new Date(userData.dob) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={handleDobChange}
              maximumDate={new Date()}
              onTouchCancel={() => setShowDobPicker(false)}
            />
          )}
          {Platform.OS === "ios" && showDobPicker && (
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={() => setShowDobPicker(false)}>
                <ThemedText type="action">Confirm</ThemedText>
              </Pressable>
            </ThemedView>
          )}
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={handleSave}>
              <ThemedText
                type="action"
                style={[globalStyles.baseText, globalStyles.actionText2]}
              >
                Save Changes
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={responsiveStyles.card}>
          <ThemedText type="semiLarge">Notification Preferences</ThemedText>
          <ThemedView style={responsiveStyles.row}>
            <ThemedText type="base">Enable Notifications</ThemedText>
            <Switch
              value={userData.allowNotifications ?? true}
              onValueChange={(value) =>
                setUserData({ allowNotifications: value })
              }
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.text}
            />
          </ThemedView>
          <ThemedView style={responsiveStyles.row}>
            <ThemedText type="base">Enable Alarms</ThemedText>
            <Switch
              value={userData.allowAlarms ?? true}
              onValueChange={(value) => setUserData({ allowAlarms: value })}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.text}
            />
          </ThemedView>
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={handleSave}>
              <ThemedText
                type="action"
                style={[globalStyles.baseText, globalStyles.actionText2]}
              >
                Save Preferences
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={responsiveStyles.card}>
          <ThemedText type="semiLarge">Appearance Settings</ThemedText>
          <Picker
            selectedValue={userData.themeMode || "system"}
            onValueChange={(value) => {
              setUserData({ themeMode: value });
              setThemeMode(value as "system" | "light" | "dark");
            }}
            style={responsiveStyles.picker}
            dropdownIconColor={theme.text}
          >
            <Picker.Item label="System Default" value="system" />
            <Picker.Item label="Light Mode" value="light" />
            <Picker.Item label="Dark Mode" value="dark" />
          </Picker>
          <ThemedText type="base">Language</ThemedText>
          <RNPickerSelect
            onValueChange={(value) => setUserData({ language: value })}
            value={userData.language || "english"}
            placeholder={{ label: "Select language", value: null }}
            items={[
              { label: "English", value: "english" },
              { label: "Yoruba", value: "yoruba" },
              { label: "Hausa", value: "hausa" },
              { label: "Igbo", value: "igbo" },
            ]}
            style={responsiveStyles.pickerSelect}
          />
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={handleSave}>
              <ThemedText
                type="action"
                style={[globalStyles.baseText, globalStyles.actionText2]}
              >
                Save Preferences
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={responsiveStyles.card}>
          <ThemedText type="semiLarge">Privacy Settings</ThemedText>
          {[
            ["Show Online Status", "showOnlineStatus"],
            ["Profile Visible to Groups", "showProfileToGroups"],
            ["Allow Friend Requests", "allowFriendRequests"],
            ["Allow Data Collection", "dataCollection"],
          ].map(([label, key]) => (
            <ThemedView key={key} style={responsiveStyles.row}>
              <ThemedText type="base">{label}</ThemedText>
              <Switch
                value={
                  userData.privacy?.[
                    key as keyof NonNullable<typeof userData.privacy>
                  ] ?? true
                }
                onValueChange={() =>
                  togglePrivacy(
                    key as keyof NonNullable<typeof userData.privacy>
                  )
                }
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.text}
              />
            </ThemedView>
          ))}
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={handleSave}>
              <ThemedText
                type="action"
                style={[globalStyles.baseText, globalStyles.actionText2]}
              >
                Save Privacy Settings
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={globalStyles.button2}>
          <Pressable onPress={exportData}>
            <ThemedText type="action">Download Your Data</ThemedText>
          </Pressable>
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
    borderWidth: 0.5,
  },
});
