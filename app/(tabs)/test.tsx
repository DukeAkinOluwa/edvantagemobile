import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import { getData, saveData } from "@/utils/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { theme, setThemeMode } = useTheme();
  const { userData, setUserData } = useUserData();
  const [firstName, setFirstName] = useState(userData.firstName || "");
  const [lastName, setLastName] = useState(userData.lastName || "");
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      console.log("Settings: Running loadData");
      await saveData("testKey", { test: "value" });
      const testData = await getData("testKey");
      console.log("Settings: Test AsyncStorage:", testData);
      const savedUserData = await getData("userData");
      console.log("Settings: Loaded userData:", savedUserData);
      if (savedUserData) {
        setFirstName(savedUserData.firstName || "");
        setLastName(savedUserData.lastName || "");
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
      console.log("Settings: Current userData from context:", userData);
    };
    loadData();
  }, [userData, setThemeMode]);

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
      const fileName = `profile_${Date.now()}.jpg`; // Unique filename
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      console.log("Settings: Persistent image URI:", newPath);
      setProfilePic(newPath);
    }
  };

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newUserData = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
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
      console.log("Settings: Saving userData:", newUserData);
      await setUserData(newUserData);
      await saveData("userData", newUserData);
      setThemeMode(localThemeMode as "system" | "light" | "dark");
      Alert.alert("Success", "Settings saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings.");
      console.error("Settings: Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    firstName,
    lastName,
    bio,
    dob,
    gender,
    profilePic,
    course,
    level,
    localThemeMode,
    allowNotifications,
    allowAlarms,
    setUserData,
    setThemeMode,
    isSaving,
  ]);

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <NavigationHeader title="Settings" />
      <View style={styles.container}>
        <View style={styles.profilePicContainer}>
          <Image
            source={{ uri: profilePic || "https://via.placeholder.com/100" }}
            style={styles.profilePic}
          />
          <Button
            title="Choose Profile Picture"
            onPress={pickImage}
            color={theme.primary}
          />
        </View>
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="First Name"
          placeholderTextColor={theme.border}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Last Name"
          placeholderTextColor={theme.border}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Bio"
          placeholderTextColor={theme.border}
          value={bio}
          onChangeText={setBio}
          multiline
        />
        <View>
          <Text style={[styles.label, { color: theme.text }]}>
            Date of Birth: {dob.toLocaleDateString()}
          </Text>
          <Button
            title="Select Date of Birth"
            onPress={() => setShowDobPicker(true)}
            color={theme.primary}
          />
        </View>
        {showDobPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowDobPicker(Platform.OS === "ios");
              if (date) setDob(date);
            }}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Gender"
          placeholderTextColor={theme.border}
          value={gender}
          onChangeText={setGender}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Course of Study"
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
          {["100", "200", "300", "400", "500"].map((lvl) => (
            <Picker.Item key={lvl} label={`${lvl} Level`} value={lvl} />
          ))}
        </Picker>
        <Text style={[styles.label, { color: theme.text }]}>Theme</Text>
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
        <View style={styles.switchContainer}>
          <Text style={{ color: theme.text }}>Enable Notifications</Text>
          <Switch
            value={allowNotifications}
            onValueChange={setAllowNotifications}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.background}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={{ color: theme.text }}>Enable Alarms</Text>
          <Switch
            value={allowAlarms}
            onValueChange={setAllowAlarms}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.background}
          />
        </View>
        <Button
          title="Save Settings"
          onPress={handleSave}
          color={theme.primary}
          disabled={isSaving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  container: {
    padding: 20,
  },
  input: {
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
  label: {
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
