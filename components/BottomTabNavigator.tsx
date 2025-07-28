import { useTheme } from "@/components/Header";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpenIcon,
  CalendarDotsIcon,
  ChatsIcon,
  GlobeHemisphereEastIcon,
  HouseIcon,
} from "phosphor-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedView } from "./ThemedView";

import ChatListScreen from "@/app/(tabs)/chatlistscreen";
import ExploreScreen from "@/app/(tabs)/explore";
import HomeScreen from "@/app/(tabs)/index";
import ResourcesScreen from "@/app/(tabs)/resources";
import ScheduleScreen from "@/app/(tabs)/schedule";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const TAB_COUNT = 5;
const TAB_WIDTH = width / TAB_COUNT;

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { theme } = useTheme();

  const translateX = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        // toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [state.index]);

  const iconMap: Record<
    string,
    React.ComponentType<any>
  > = {
    index: HouseIcon,
    schedule: CalendarDotsIcon,
    chatlistscreen: ChatsIcon,
    resources: BookOpenIcon,
    explore: GlobeHemisphereEastIcon,
  };

  return (
    <View>
      <Animated.View
        style={[
          styles.semiCircle,
          {
            backgroundColor: theme.background,
            elevation: 5,
            borderWidth: 1,
            borderColor: theme.primary,
            transform: [{ translateX }, { translateY }],
          },
        ]}
      />
      <ThemedView style={[styles.tabBarContainer, { backgroundColor: theme.background }]}>
        {state.routes.map((route: any, index: number) => {
          const Icon = iconMap[route.name];
          const label = descriptors[route.key].options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Icon
                size={isFocused ? 28 : 22}
                color={isFocused ? theme.primary : theme.border}
                weight={isFocused ? "fill" : "regular"}
                style={{ marginBottom: 4 }}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? theme.primary : theme.border },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </View>
  );
};

export default function BottomTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="index" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="schedule" component={ScheduleScreen} options={{ title: "Schedule" }} />
      <Tab.Screen name="chatlistscreen" component={ChatListScreen} options={{ title: "Chats" }} />
      <Tab.Screen name="resources" component={ResourcesScreen} options={{ title: "Resources" }} />
      <Tab.Screen name="explore" component={ExploreScreen} options={{ title: "Explore" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    height: 70,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    width,
    justifyContent: "space-around",
    position: "absolute",
    bottom: 0,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  semiCircle: {
    position: "absolute",
    bottom: 70 - 50,
    width: 80,
    height: 60,
    borderRadius: 20,
  },
});