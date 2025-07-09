import { NavigationHeader } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";

import { useTheme, useUserData } from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { getData } from "../utils/storage";

export default function userProfileSettingsPage() {
  const { theme, setThemeMode } = useTheme();
  const { userData, setUserData } = useUserData();
  const [firstName, setFirstName] = useState(userData.firstName || "");
  const [lastName, setLastName] = useState(userData.lastName || "");
  const [email, setEmail] = useState(userData.email || "");
  const [university, setUniversity] = useState(userData.university || "");
  const [bio, setBio] = useState(userData.bio || "");
  const [dob, setDob] = useState(
    userData.dob ? new Date(userData.dob) : new Date()
  );
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState(userData.gender || "");
  const [profilePic, setProfilePic] = useState<string | undefined>(
    userData.profilePic
  );
  const [course, setCourse] = useState(userData.course || "");
  const [level, setLevel] = useState(userData.level || "100");
  const [localThemeMode, setLocalThemeMode] = useState(
    userData.themeMode || "system"
  );
  const [allowNotifications, setAllowNotifications] = useState(
    userData.allowNotifications !== false
  );
  const [allowAlarms, setAllowAlarms] = useState(
    userData.allowAlarms !== false
  );

  useEffect(() => {
    const loadData = async () => {
      const savedUserData = await getData("userData");
      if (savedUserData) {
        setFirstName(savedUserData.firstName || "");
        setLastName(savedUserData.lastName || "");
        setEmail(savedUserData.email || "");
        setUniversity(savedUserData.university || "");
        setBio(savedUserData.bio || "");
        setDob(savedUserData.dob ? new Date(savedUserData.dob) : new Date());
        setGender(savedUserData.gender || "");
        setProfilePic(savedUserData.profilePic || undefined);
        setCourse(savedUserData.course || "");
        setLevel(savedUserData.level || "100");
        setLocalThemeMode(savedUserData.themeMode || "system");
        setAllowNotifications(savedUserData.allowNotifications !== false);
        setAllowAlarms(savedUserData.allowAlarms !== false);
        setThemeMode(savedUserData.themeMode || "system");
      }
    };
    loadData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Allow access to select a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
    }
  };

  const handleSave = async () => {
    const newUserData = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      email: email.trim() || undefined,
      university: university.trim() || undefined,
      bio: bio.trim() || undefined,
      dob: dob.toISOString(),
      gender: gender.trim() || undefined,
      profilePic,
      course: course.trim() || undefined,
      level: level || undefined,
      themeMode: localThemeMode,
      allowNotifications,
      allowAlarms,
    };

    try {
      await setUserData(newUserData);
      setThemeMode(localThemeMode as "system" | "light" | "dark");
      Alert.alert("Success", "Settings saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings.");
      console.error("Save error:", error);
    }
  };

  /////////////////////////////////////////////////////////////
  const deviceTheme = useColorScheme() ?? "light";
  const colorSet = Colors[deviceTheme];
  type ThemeSetting = "light" | "dark" | "system";
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>("system");
  const effectiveTheme =
    themeSetting === "system" ? deviceTheme ?? "light" : themeSetting;

  console.log(effectiveTheme);

  const dynamicStyles = StyleSheet.create({
    tabBarContainer: {
      shadowColor:
        theme.shadow || (effectiveTheme === "light" ? "#000" : "#FFF"),
    },
  });

  const { screenHeight, screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();

  // PROFILE
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    university: "",
    department: "",
    level: "",
    bio: "",
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfileChanges = () => {
    alert("Profile updated successfully!");
  };

  // NOTIFICATIONS
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    eventAlerts: true,
    groupMessages: true,
    achievementAlerts: true,
  });

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveNotification = () => {
    alert("Notification preferences saved.");
  };

  // APPEARANCE
  const [language, setLanguage] = useState("english");

  const toggleTheme = () => {
    const newTheme = effectiveTheme === "light" ? "dark" : "light";
    setThemeSetting(newTheme);
    alert(
      `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`
    );
  };

  const saveAppearance = () => {
    alert("Appearance preferences saved.");
  };

  // PRIVACY
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showProfileToGroups: true,
    allowFriendRequests: true,
    dataCollection: true,
  });

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = () => {
    Alert.alert("Data Export", "Your data export has been initiated.");
  };

  const savePrivacy = () => {
    alert("Privacy settings saved.");
  };

  const responsiveStyles = StyleSheet.create({
    input: {
      width: screenWidth - 20 - 10 - 20,
    },
    row: {
      width: screenWidth - 20 - 10 - 20,
    },
    card: {
      width: screenWidth - 20 - 3,
      gap: 10,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 20,

      // iOS shadow
      shadowColor: theme.shadow || "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,

      // Android shadow
      elevation: 4,
    },
  });

  return (
    <ThemedView style={{ flex: 1, gap: 10, backgroundColor: theme.background }}>
      <NavigationHeader title="Settings" />
      <ParallaxScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ backgroundColor: theme.background }}
      >
        <ThemedView
          style={{
            gap: 20,
            paddingVertical: 10,
            backgroundColor: theme.background,
          }}
        >
          <View
            style={[
              styles.profilePicContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Image
              source={{ uri: profilePic || "https://via.placeholder.com/100" }}
              style={[styles.profilePic, { borderColor: theme.border }]}
            />
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={pickImage}>
                <ThemedText style={globalStyles.actionText2}>
                  Choose Profile Image
                </ThemedText>
              </Pressable>
            </ThemedView>
          </View>
          {/* PROFILE */}
          <ThemedView
            style={[
              responsiveStyles.card,
              { backgroundColor: theme.background },
            ]}
          >
            <ThemedText
              style={[
                styles.title,
                globalStyles.semiLargeText,
                { color: theme.text },
              ]}
            >
              Profile Information
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder="First Name"
              placeholderTextColor={theme.border}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder="Last Name"
              placeholderTextColor={theme.border}
              value={lastName}
              onChangeText={setLastName}
            />

            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              keyboardType="email-address"
              placeholder="Email Address"
              placeholderTextColor={theme.border}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder="University/Institution"
              placeholderTextColor={theme.border}
              value={university}
              onChangeText={setUniversity}
            />
            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder="Department"
              placeholderTextColor={theme.border}
              value={course}
              onChangeText={setCourse}
            />

            <Picker
              selectedValue={level}
              onValueChange={setLevel}
              style={[
                styles.picker,
                { color: theme.text, backgroundColor: theme.background },
              ]}
              dropdownIconColor={theme.text}
            >
              {["100", "200", "300", "400", "500", "Postgraduate"].map(
                (lvl) => (
                  <Picker.Item key={lvl} label={`${lvl} Level`} value={lvl} />
                )
              )}
            </Picker>

            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                globalStyles.baseText,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder="Bio"
              placeholderTextColor={theme.border}
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={handleSave}>
                <ThemedText style={globalStyles.actionText2}>
                  Save Changes
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* NOTIFICATIONS */}
          <ThemedView
            style={[
              responsiveStyles.card,
              { backgroundColor: theme.background },
            ]}
          >
            <ThemedText
              style={[
                styles.sectionTitle,
                globalStyles.semiLargeText,
                { color: theme.text },
              ]}
            >
              Notification Preferences
            </ThemedText>
            <View
              style={[
                styles.switchContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.label, { color: theme.text }]}>
                Enable Notifications
              </Text>
              <Switch
                value={allowNotifications}
                onValueChange={setAllowNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.background}
              />
            </View>
          </ThemedView>

          {/* APPEARANCE */}
          <ThemedView
            style={[
              responsiveStyles.card,
              { backgroundColor: theme.background },
            ]}
          >
            <ThemedText
              style={[
                styles.sectionTitle,
                globalStyles.semiLargeText,
                { color: theme.text },
              ]}
            >
              Appearance Settings
            </ThemedText>
            <Picker
              selectedValue={localThemeMode}
              onValueChange={(value) =>
                setLocalThemeMode(value as "system" | "light" | "dark")
              }
              style={[
                styles.picker,
                { color: theme.text, backgroundColor: theme.background },
              ]}
              dropdownIconColor={theme.text}
            >
              <Picker.Item label="System Default" value="system" />
              <Picker.Item label="Light Mode" value="light" />
              <Picker.Item label="Dark Mode" value="dark" />
            </Picker>

            <ThemedText
              style={[styles.label, { marginTop: 20, color: theme.text }]}
            >
              Language
            </ThemedText>
            <RNPickerSelect
              onValueChange={(value) => setLanguage(value)}
              value={language}
              placeholder={{ label: "Select language", value: null }}
              items={[
                { label: "English", value: "english" },
                { label: "Yoruba", value: "yoruba" },
                { label: "Hausa", value: "hausa" },
                { label: "Igbo", value: "igbo" },
              ]}
              style={{
                inputIOS: {
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 6,
                  color: theme.text,
                  paddingRight: 30,
                  marginBottom: 12,
                  backgroundColor: theme.background,
                },
                inputAndroid: {
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 6,
                  color: theme.text,
                  paddingRight: 30,
                  marginBottom: 12,
                  backgroundColor: theme.background,
                },
              }}
            />
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={handleSave}>
                <ThemedText style={globalStyles.actionText2}>
                  Save Preferences
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* PRIVACY */}
          <ThemedView
            style={[
              responsiveStyles.card,
              { backgroundColor: theme.background },
            ]}
          >
            <ThemedText
              style={[
                styles.sectionTitle,
                globalStyles.semiLargeText,
                { color: theme.text },
              ]}
            >
              Privacy Settings
            </ThemedText>
            {[
              ["Show Online Status", "showOnlineStatus"],
              ["Profile Visible to Groups", "showProfileToGroups"],
              ["Allow Friend Requests", "allowFriendRequests"],
              ["Allow Data Collection", "dataCollection"],
            ].map(([label, key]) => (
              <ThemedView
                key={key}
                style={[
                  styles.row,
                  responsiveStyles.row,
                  { backgroundColor: theme.background },
                ]}
              >
                <ThemedText style={[styles.label, { color: theme.text }]}>
                  {label}
                </ThemedText>
                <Switch
                  value={privacy[key as keyof typeof privacy]}
                  onValueChange={() => togglePrivacy(key as any)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.background}
                />
              </ThemedView>
            ))}
          </ThemedView>

          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={exportData}>
              <ThemedText style={globalStyles.actionText2}>
                Download Your Data
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={globalStyles.button1}>
            <TouchableOpacity onPress={handleSave}>
              <ThemedText style={globalStyles.actionText2}>
                Save Privacy Settings
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 20 },
  input: {
    borderWidth: 0.5,
    borderColor: "rgba(17, 17, 17, 0.2)",
    borderStyle: "solid",
    borderRadius: 6,
    padding: Platform.OS === "ios" ? 12 : 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
  },

  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  container: {
    padding: 20,
  },
  input1: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  label1: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
});

const pickerStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 6,
    color: "black",
    paddingRight: 30,
    marginBottom: 12,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 6,
    color: "black",
    paddingRight: 30,
    marginBottom: 12,
  },
};
