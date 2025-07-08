import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';

import { useThemeContext } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeSetting = 'light' | 'dark' | 'system';

const notificationItems = [
  { label: 'Email Notifications', key: 'emailNotifications' },
  { label: 'Push Notifications', key: 'pushNotifications' },
  { label: 'Task Reminders', key: 'taskReminders' },
  { label: 'Event Alerts', key: 'eventAlerts' },
  { label: 'Group Messages', key: 'groupMessages' },
  { label: 'Achievement Alerts', key: 'achievementAlerts' },
] as const;

const privacyItems = [
  { label: 'Show Online Status', key: 'showOnlineStatus' },
  { label: 'Profile Visible to Groups', key: 'showProfileToGroups' },
  { label: 'Allow Friend Requests', key: 'allowFriendRequests' },
  { label: 'Allow Data Collection', key: 'dataCollection' },
] as const;

export default function UserProfileSettingsPage() {
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles();

  const { themeSetting, setThemeSetting, resolvedTheme } = useThemeContext();
  const effectiveTheme = resolvedTheme;
  const colorSet = Colors[effectiveTheme] || Colors.light;

  const [language, setLanguage] = useState('english');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university: '',
    department: '',
    level: '',
    bio: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    eventAlerts: true,
    groupMessages: true,
    achievementAlerts: true,
  });

  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showProfileToGroups: true,
    allowFriendRequests: true,
    dataCollection: true,
  });

  const handleProfileChange = (field: string, value: string) =>
    setProfileData((prev) => ({ ...prev, [field]: value }));

  const toggleSetting = (key: string, setter: React.Dispatch<any>) =>
    setter((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const saveMessage = (msg: string) => () => Alert.alert('Info', msg);

  const exportData = () =>
    Alert.alert('Data Export', 'Your data export has been initiated.');

  const responsiveStyles = StyleSheet.create({
    input: { width: screenWidth - 50 },
    row: { width: screenWidth - 50 },
    card: {
      width: screenWidth - 23,
      gap: 10,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 4,
    },
  });

  const renderToggleRow = (
    label: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <ThemedView style={[styles.row, responsiveStyles.row]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Switch value={value} onValueChange={onToggle} />
    </ThemedView>
  );

  useEffect(() => {
    const loadThemeSetting = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeSetting');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeSetting(savedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme setting', e);
      }
    };
    loadThemeSetting();
  }, []);

  useEffect(() => {
    const saveThemeSetting = async () => {
      try {
        await AsyncStorage.setItem('themeSetting', themeSetting);
      } catch (e) {
        console.error('Failed to save theme setting', e);
      }
    };
    saveThemeSetting();
  }, [themeSetting]);

  return (
    <ThemedView style={{ flex: 1, gap: 10 }}>
      <NavigationHeader title="Settings" />
      <ParallaxScrollView>
        <ThemedView style={{ gap: 20, paddingVertical: 10 }}>

          {/* PROFILE */}
          <ThemedView style={responsiveStyles.card}>
            <ThemedText style={[styles.title, globalStyles.semiLargeText]}>Profile Information</ThemedText>

            {[
              { placeholder: 'Full Name', field: 'name' },
              { placeholder: 'Email Address', field: 'email', keyboardType: 'email-address' },
              { placeholder: 'University/Institution', field: 'university' },
              { placeholder: 'Department', field: 'department' },
            ].map(({ placeholder, field, keyboardType = 'default' }) => (
              <TextInput
                key={field}
                placeholder={placeholder}
                value={profileData[field as keyof typeof profileData] ?? ''}
                keyboardType={keyboardType as any}
                style={[styles.input, responsiveStyles.input, globalStyles.baseText]}
                onChangeText={(text) => handleProfileChange(field, text)}
              />
            ))}

            <RNPickerSelect
              onValueChange={(value) => handleProfileChange('level', value)}
              placeholder={{ label: 'Select your level', value: null }}
              items={[
                { label: '100 Level', value: '100 Level' },
                { label: '200 Level', value: '200 Level' },
                { label: '300 Level', value: '300 Level' },
                { label: '400 Level', value: '400 Level' },
                { label: '500 Level', value: '500 Level' },
                { label: 'Postgraduate', value: 'Postgraduate' },
              ]}
              value={profileData.level}
              style={pickerStyles}
            />

            <TextInput
              style={[styles.input, responsiveStyles.input, globalStyles.baseText]}
              placeholder="Bio"
              value={profileData.bio ?? ''}
              multiline
              onChangeText={(text) => handleProfileChange('bio', text)}
            />

            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={saveMessage('Profile updated successfully!')}>
                <ThemedText style={globalStyles.actionText2}>Save Changes</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* NOTIFICATIONS */}
          <ThemedView style={responsiveStyles.card}>
            <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>
              Notification Preferences
            </ThemedText>
            {notificationItems.map(({ label, key }) =>
              renderToggleRow(label, notificationSettings[key], () =>
                toggleSetting(key, setNotificationSettings)
              )
            )}
            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={saveMessage('Notification preferences saved.')}>
                <ThemedText style={globalStyles.actionText2}>Save Preferences</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* APPEARANCE */}
          <ThemedView style={responsiveStyles.card}>
            <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>
              Appearance Settings
            </ThemedText>

            <RNPickerSelect
              onValueChange={(value: ThemeSetting) => setThemeSetting(value)}
              value={themeSetting}
              items={[
                { label: 'System Default', value: 'system' },
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
              style={pickerStyles}
            />

            <ThemedText style={[styles.label, { marginTop: 20 }]}>Language</ThemedText>
            <RNPickerSelect
              onValueChange={setLanguage}
              value={language}
              placeholder={{ label: 'Select language', value: null }}
              items={[
                { label: 'English', value: 'english' },
                { label: 'Yoruba', value: 'yoruba' },
                { label: 'Hausa', value: 'hausa' },
                { label: 'Igbo', value: 'igbo' },
              ]}
              style={pickerStyles}
            />

            <ThemedView style={globalStyles.button1}>
              <Pressable onPress={saveMessage('Appearance preferences saved.')}>
                <ThemedText style={globalStyles.actionText2}>Save Preferences</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* PRIVACY */}
          <ThemedView style={responsiveStyles.card}>
            <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>
              Privacy Settings
            </ThemedText>
            {privacyItems.map(({ label, key }) =>
              renderToggleRow(label, privacy[key], () => toggleSetting(key, setPrivacy))
            )}
          </ThemedView>

          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={exportData}>
              <ThemedText style={globalStyles.actionText2}>Download Your Data</ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={globalStyles.button1}>
            <Pressable onPress={saveMessage('Privacy settings saved.')}>
              <ThemedText style={globalStyles.actionText2}>Save Privacy Settings</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 20 },
  input: {
    borderWidth: 0.5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
    borderRadius: 6,
    padding: Platform.OS === 'ios' ? 12 : 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
});

const pickerStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 6,
    color: 'black',
    paddingRight: 30,
    marginBottom: 12,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 6,
    color: 'black',
    paddingRight: 30,
    marginBottom: 12,
  },
};