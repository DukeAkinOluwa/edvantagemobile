import { CustomTabBar } from "@/components/BottomTabNavigator";
import { useUserData } from "@/components/HeaderContext";
import { Tabs } from "expo-router";
import React from "react";

const screenOptions = { headerShown: false };

export default function TabLayout() {
  const { userData } = useUserData();
  const renderTabBar = React.useCallback((props: any) => <CustomTabBar {...props} />, []);

  const isLecturer = userData.role === "lecturer";

  return (
    <Tabs
      screenOptions={screenOptions}
      tabBar={renderTabBar}
    >
      <Tabs.Screen name="index" options={{ title: isLecturer ? "Portal" : "Home" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="chatlistscreen" options={{ title: "Chats" }} />
      <Tabs.Screen name="resources" options={{ title: "Resources" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", href: isLecturer ? null : undefined }} />
    </Tabs>
  );
}
