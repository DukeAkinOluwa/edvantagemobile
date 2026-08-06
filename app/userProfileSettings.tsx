import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function userProfileSettingsPage(){
    return (
        <ParallaxScrollView>
            <ProfileTab />
            <NotificationTab />
            <AppearanceTab />
            <PrivacyTab />
        </ParallaxScrollView>
    )
}


// tabs/ProfileTab.tsx
import React, { useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const ProfileTab = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university: '',
    department: '',
    level: '',
    bio: '',
  });

  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfileChanges = () => {
    // Simulate saving
    alert('Profile updated successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={profileData.name}
        onChangeText={(text) => handleChange('name', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={profileData.email}
        keyboardType="email-address"
        onChangeText={(text) => handleChange('email', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="University/Institution"
        value={profileData.university}
        onChangeText={(text) => handleChange('university', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Department"
        value={profileData.department}
        onChangeText={(text) => handleChange('department', text)}
      />

      <RNPickerSelect
        onValueChange={(value) => handleChange('level', value)}
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
        style={styles.input}
        placeholder="Bio"
        value={profileData.bio}
        multiline
        onChangeText={(text) => handleChange('bio', text)}
      />

      <Button title="Save Changes" onPress={saveProfileChanges} />
    </ScrollView>
  );
};

// tabs/NotificationTab.tsx
import { Switch, } from 'react-native';

const NotificationTab = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    eventAlerts: true,
    groupMessages: true,
    achievementAlerts: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = () => {
    alert('Notification preferences saved.');
  };

  return (
    <ScrollView style={styles.notificationscontainer}>
      <Text style={styles.notificationstitle}>Notification Preferences</Text>

      {[
        ['Email Notifications', 'emailNotifications'],
        ['Push Notifications', 'pushNotifications'],
        ['Task Reminders', 'taskReminders'],
        ['Event Alerts', 'eventAlerts'],
        ['Group Messages', 'groupMessages'],
        ['Achievement Alerts', 'achievementAlerts']
      ].map(([label, key]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Switch value={settings[key as keyof typeof settings]} onValueChange={() => toggle(key as any)} />
        </View>
      ))}

      <Button title="Save Preferences" onPress={save} />
    </ScrollView>
  );
};

const AppearanceTab = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('english');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    alert(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`);
  };

  const save = () => {
    alert('Appearance preferences saved.');
  };

  return (
    <View style={styles.appearancecontainer}>
      <Text style={styles.appearancetitle}>Appearance Settings</Text>

      <View style={styles.appearancerow}>
        <Text style={styles.label}>Theme: {theme === 'dark' ? 'Dark' : 'Light'} Mode</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
      </View>

      <Text style={[styles.appearancelabel, { marginTop: 20 }]}>Language</Text>
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

      <View style={{ marginTop: 20 }}>
        <Button title="Save Preferences" onPress={save} />
      </View>
    </View>
  );
};

// tabs/PrivacyTab.tsx
import { Alert } from 'react-native';

const PrivacyTab = () => {
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showProfileToGroups: true,
    allowFriendRequests: true,
    dataCollection: true,
  });

  const toggle = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = () => {
    Alert.alert("Data Export", "Your data export has been initiated.");
  };

  const save = () => {
    alert('Privacy settings saved.');
  };

  return (
    <View style={styles.privacycontainer}>
      <Text style={styles.privacytitle}>Privacy Settings</Text>

      {[
        ['Show Online Status', 'showOnlineStatus'],
        ['Profile Visible to Groups', 'showProfileToGroups'],
        ['Allow Friend Requests', 'allowFriendRequests'],
        ['Allow Data Collection', 'dataCollection']
      ].map(([label, key]) => (
        <View key={key} style={styles.privacyrow}>
          <Text style={styles.privacylabel}>{label}</Text>
          <Switch value={privacy[key as keyof typeof privacy]} onValueChange={() => toggle(key as any)} />
        </View>
      ))}

      <View style={{ marginTop: 24 }}>
        <Button title="Download Your Data" onPress={exportData} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button title="Save Privacy Settings" onPress={save} />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: 12
  },
  
  notificationscontainer: { padding: 16, backgroundColor: '#fff' },
  notificationstitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 16 },

  
  appearancecontainer: { padding: 16, backgroundColor: '#fff', flex: 1 },
  appearancetitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  appearancerow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appearancelabel: { fontSize: 16 },

  
  privacycontainer: { padding: 16, backgroundColor: '#fff', flex: 1 },
  privacytitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  privacyrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  privacylabel: { fontSize: 16 }
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
    marginBottom: 12
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