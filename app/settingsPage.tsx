import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

export default function userProfileSettingsPage() {

    const { screenHeight, screenWidth } = useResponsiveDimensions()
    const globalStyles = useGlobalStyles()

    // PROFILE
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        university: '',
        department: '',
        level: '',
        bio: '',
    });

    const handleProfileChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const saveProfileChanges = () => {
        alert('Profile updated successfully!');
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
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const saveNotification = () => {
        alert('Notification preferences saved.');
    };

    // APPEARANCE
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [language, setLanguage] = useState('english');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        alert(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`);
    };

    const saveAppearance = () => {
        alert('Appearance preferences saved.');
    };

    // PRIVACY
    const [privacy, setPrivacy] = useState({
        showOnlineStatus: true,
        showProfileToGroups: true,
        allowFriendRequests: true,
        dataCollection: true,
    });

    const togglePrivacy = (key: keyof typeof privacy) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const exportData = () => {
        Alert.alert("Data Export", "Your data export has been initiated.");
    };

    const savePrivacy = () => {
        alert('Privacy settings saved.');
    };

    const responsiveStyles = StyleSheet.create({
        input: {
            width: screenWidth - 20 - 10 - 20
        },
        row: {
            width: screenWidth - 20 - 10 - 20
        },
        card: {
            width: screenWidth - 20- 3,
            gap: 10,
            borderRadius: 8,
            paddingHorizontal: 15,
            paddingVertical: 20,

            // iOS shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,

            // Android shadow
            elevation: 4,
        }
    })

  return (
    <ThemedView style={{ flex: 1, gap: 10 }}>
      <NavigationHeader title="Settings" />
      <ParallaxScrollView>
        <ThemedView style={{gap: 20, paddingVertical: 10}}>
            {/* PROFILE */}
            <ThemedView style={responsiveStyles.card}>
                <ThemedText style={[styles.title, globalStyles.semiLargeText]}>Profile Information</ThemedText>

                <TextInput style={[ styles.input, responsiveStyles.input, globalStyles.baseText ]} placeholder="Full Name" value={profileData.name} onChangeText={(text) => handleProfileChange('name', text)} />
                <TextInput style={[ styles.input, responsiveStyles.input, globalStyles.baseText ]} placeholder="Email Address" value={profileData.email} keyboardType="email-address" onChangeText={(text) => handleProfileChange('email', text)} />
                <TextInput style={[ styles.input, responsiveStyles.input, globalStyles.baseText ]} placeholder="University/Institution" value={profileData.university} onChangeText={(text) => handleProfileChange('university', text)} />
                <TextInput style={[ styles.input, responsiveStyles.input, globalStyles.baseText ]} placeholder="Department" value={profileData.department} onChangeText={(text) => handleProfileChange('department', text)} />

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

                <TextInput style={[ styles.input, responsiveStyles.input, globalStyles.baseText ]} placeholder="Bio" value={profileData.bio} multiline onChangeText={(text) => handleProfileChange('bio', text)} />
                <ThemedView style={globalStyles.button1}>
                    <Pressable onPress={saveProfileChanges}>
                        <ThemedText style={globalStyles.actionText2}>Save Changes</ThemedText>
                    </Pressable>
                </ThemedView>
            </ThemedView>

            {/* NOTIFICATIONS */}
            <ThemedView style={responsiveStyles.card}>
                <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>Notification Preferences</ThemedText>
                {[
                    ['Email Notifications', 'emailNotifications'],
                    ['Push Notifications', 'pushNotifications'],
                    ['Task Reminders', 'taskReminders'],
                    ['Event Alerts', 'eventAlerts'],
                    ['Group Messages', 'groupMessages'],
                    ['Achievement Alerts', 'achievementAlerts']
                ].map(([label, key]) => (
                <ThemedView key={key} style={[styles.row, responsiveStyles.row]}>
                    <ThemedText style={styles.label}>{label}</ThemedText>
                    <Switch value={notificationSettings[key as keyof typeof notificationSettings]} onValueChange={() => toggleNotification(key as any)} />
                </ThemedView>
                ))}
                <ThemedView style={globalStyles.button1}>
                    <Pressable onPress={saveNotification}>
                        <ThemedText style={globalStyles.actionText2}>Save Preferences</ThemedText>
                    </Pressable>
                </ThemedView>
            </ThemedView>

            {/* APPEARANCE */}
            <ThemedView style={responsiveStyles.card}>
                <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>Appearance Settings</ThemedText>
                <ThemedView style={[styles.row, responsiveStyles.row]}>
                <ThemedText style={styles.label}>Theme: {theme === 'dark' ? 'Dark' : 'Light'} Mode</ThemedText>
                <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
                </ThemedView>

                <ThemedText style={[styles.label, { marginTop: 20 }]}>Language</ThemedText>
                <RNPickerSelect
                onValueChange={value => setLanguage(value)}
                value={language}
                placeholder={{ label: 'Select language', value: null }}
                items={[
                    { label: 'English', value: 'english' },
                    { label: 'Yoruba', value: 'yoruba' },
                    { label: 'Hausa', value: 'hausa' },
                    { label: 'Igbo', value: 'igbo' }
                ]}
                style={pickerStyles}
                />
                <ThemedView style={globalStyles.button1}>
                    <Pressable onPress={saveAppearance}>
                        <ThemedText style={globalStyles.actionText2}>Save Preferences</ThemedText>
                    </Pressable>
                </ThemedView>
            </ThemedView>

            {/* PRIVACY */}
            <ThemedView style={responsiveStyles.card}>
                <ThemedText style={[styles.sectionTitle, globalStyles.semiLargeText]}>Privacy Settings</ThemedText>
                {[
                    ['Show Online Status', 'showOnlineStatus'],
                    ['Profile Visible to Groups', 'showProfileToGroups'],
                    ['Allow Friend Requests', 'allowFriendRequests'],
                    ['Allow Data Collection', 'dataCollection']
                ].map(([label, key]) => (
                <ThemedView key={key} style={[styles.row, responsiveStyles.row]}>
                    <ThemedText style={styles.label}>{label}</ThemedText>
                    <Switch value={privacy[key as keyof typeof privacy]} onValueChange={() => togglePrivacy(key as any)} />
                </ThemedView>
                ))}
            </ThemedView>

            <ThemedView style={globalStyles.button1}>
                <Pressable onPress={exportData}>
                    <ThemedText style={globalStyles.actionText2}>Download Your Data</ThemedText>
                </Pressable>
            </ThemedView>
            <ThemedView style={globalStyles.button1}>
                <Pressable onPress={savePrivacy}>
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
    borderWidth: .5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
    borderStyle: 'solid',
    borderRadius: 6,
    padding: Platform.OS === 'ios' ? 12 : 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16
  }
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
    marginBottom: 12
  }
};