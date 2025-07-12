import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { memo, useMemo, useState } from "react";
import {
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
import { saveData } from "../utils/storage";

const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.profilePic, { borderColor }]} />
  )
);

export default function SignUpPage() {
  const { theme } = useTheme();
  const { setUserData } = useUserData();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [level, setLevel] = useState("100");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const [localThemeMode, setLocalThemeMode] = useState<
    "system" | "light" | "dark"
  >("system");
  const [error, setError] = useState<string | null>(null);

  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();
  const router = useRouter();

  const imageUri = useMemo(() => {
    return profilePic || "https://via.placeholder.com/100";
  }, [profilePic]);

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
        quality: 0.2,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const fileName = `profile_${Date.now()}.jpg`;
        const persistentUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, {
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

        if (profilePic && profilePic.startsWith(FileSystem.documentDirectory)) {
          await FileSystem.deleteAsync(profilePic, { idempotent: true });
        }

        setProfilePic(persistentUri);
        Alert.alert(
          "Success",
          "Profile picture selected. Please complete sign-up."
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to pick image: ${errorMessage}`);
      Alert.alert("Error", `Failed to pick image: ${errorMessage}`);
    }
  };

  const clearProfilePic = async () => {
    try {
      if (profilePic && profilePic.startsWith(FileSystem.documentDirectory)) {
        await FileSystem.deleteAsync(profilePic, { idempotent: true });
      }
      setProfilePic(undefined);
      Alert.alert("Success", "Profile picture cleared.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to clear profile picture: ${errorMessage}`);
      Alert.alert("Error", `Failed to clear profile picture: ${errorMessage}`);
    }
  };

  const handleDobChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDobPicker(false);
    }
    if (selected && !isNaN(selected.getTime())) {
      setDob(selected);
    }
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !university.trim() ||
        !department.trim() ||
        !gender
      ) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address.");
      }
      if (isNaN(dob.getTime())) {
        throw new Error("Invalid date of birth.");
      }

      const newUserData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        university: university.trim(),
        department: department.trim(),
        faculty: faculty.trim() || undefined,
        course: department.trim(),
        level,
        gender,
        dob: dob.toISOString(),
        profilePic,
        themeMode: localThemeMode,
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
      router.replace("(tabs)");
      Alert.alert("Success", "Sign-up completed!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign up";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };

  const responsiveStyles = StyleSheet.create({
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
      backgroundColor: theme.background,
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
      <ThemedText
        style={[
          styles.title,
          globalStyles.semiLargeText,
          { color: theme.text },
        ]}
      >
        Sign Up
      </ThemedText>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={responsiveStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={responsiveStyles.card}>
          <View style={styles.profilePicContainer}>
            <ProfileImage uri={imageUri} borderColor={theme.border} />
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={pickImage}>
                <ThemedText style={globalStyles.actionText2}>
                  Choose Profile Image
                </ThemedText>
              </Pressable>
            </ThemedView>
            {profilePic && (
              <ThemedView style={globalStyles.button1}>
                <Pressable onPress={clearProfilePic}>
                  <ThemedText style={globalStyles.actionText2}>
                    Clear Profile Image
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </View>

          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="First Name *"
            placeholderTextColor={theme.placeholder}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Last Name *"
            placeholderTextColor={theme.placeholder}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            keyboardType="email-address"
            placeholder="Email Address *"
            placeholderTextColor={theme.placeholder}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="University/Institution *"
            placeholderTextColor={theme.placeholder}
            value={university}
            onChangeText={setUniversity}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Department *"
            placeholderTextColor={theme.placeholder}
            value={department}
            onChangeText={setDepartment}
          />
          <TextInput
            style={[responsiveStyles.input, globalStyles.baseText]}
            placeholder="Faculty"
            placeholderTextColor={theme.placeholder}
            value={faculty}
            onChangeText={setFaculty}
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
            {["100", "200", "300", "400", "500", "Postgraduate"].map((lvl) => (
              <Picker.Item key={lvl} label={`${lvl} Level`} value={lvl} />
            ))}
          </Picker>
          <Picker
            selectedValue={gender}
            onValueChange={setGender}
            style={[
              styles.picker,
              { color: theme.text, backgroundColor: theme.background },
            ]}
            dropdownIconColor={theme.text}
          >
            <Picker.Item label="Select Gender *" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
          <TouchableOpacity onPress={() => setShowDobPicker(true)}>
            <ThemedText
              style={[
                responsiveStyles.input,
                globalStyles.baseText,
                { color: theme.text },
              ]}
            >
              Date of Birth: {dob ? dob.toLocaleDateString() : "Select Date *"}
            </ThemedText>
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={dob}
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
                <ThemedText style={globalStyles.actionText2}>
                  Confirm
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}
          <Picker
            selectedValue={localThemeMode}
            onValueChange={(value) => setLocalThemeMode(value)}
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
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={handleSignUp}>
              <ThemedText style={globalStyles.actionText2}>Sign Up</ThemedText>
            </Pressable>
          </ThemedView>
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
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 12,
  },
});
