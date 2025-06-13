import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
    const theme = useColorScheme() ?? 'light';
    const colorSet = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorSet.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          // backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          elevation: 10, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Montserrat-SemiBold',
          marginBottom: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <FontAwesome name="home" size={focused ? 30 : 24} color={focused ? colorSet.primary : 'gray'} style={{ marginBottom: 4 }} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <FontAwesome name="calendar" size={focused ? 30 : 24} color={focused ? colorSet.primary : 'gray'} style={{ marginBottom: 4 }} />,
        }}
      />
      <Tabs.Screen
        name="chatlistscreen"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => <FontAwesome name="comment" size={focused ? 30 : 24} color={focused ? colorSet.primary : 'gray'} style={{ marginBottom: 4 }} />,
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ focused }) => <FontAwesome name="book" size={focused ? 30 : 24} color={focused ? colorSet.primary : 'gray'} style={{ marginBottom: 4 }} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <FontAwesome name="plane" size={focused ? 30 : 24} color={focused ? colorSet.primary : 'gray'} style={{ marginBottom: 4 }} />,
        }}
      />
    </Tabs>
  );
}
