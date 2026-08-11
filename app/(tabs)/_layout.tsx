import { CustomTabBar } from "@/components/BottomTabNavigator";
import { Tabs } from "expo-router";
import React from "react";

const screenOptions = { headerShown: false };

export default function TabLayout() {
  const renderTabBar = React.useCallback((props: any) => <CustomTabBar {...props} />, []);

  return (
    <Tabs
      screenOptions={screenOptions}
      tabBar={renderTabBar}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="chatlistscreen" options={{ title: "Chats" }} />
      <Tabs.Screen name="resources" options={{ title: "Resources" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
    </Tabs>
  );
}
