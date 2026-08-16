import { useTheme } from "@/components/HeaderContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpen,
  CalendarDots,
  Chats,
  GlobeHemisphereEast,
  House,
  ClipboardText,
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

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { theme } = useTheme();

  const iconMap: Record<
    string,
    React.ComponentType<any>
  > = {
    index: House,
    schedule: CalendarDots,
    chatlistscreen: Chats,
    resources: BookOpen,
    explore: GlobeHemisphereEast,
  };

  const visibleRoutes = (state?.routes || []).filter(
    (route: any) => descriptors?.[route.key]?.options?.href !== null && iconMap[route.name]
  );
  const activeVisibleIndex = visibleRoutes.findIndex(
    (r: any) => r.key === state?.routes?.[state?.index]?.key
  );
  // Default to 0 if the current route is hidden
  const displayIndex = activeVisibleIndex >= 0 ? activeVisibleIndex : 0;

  const visibleCount = visibleRoutes.length || 5;
  const tabWidth = width / visibleCount;
  const BUBBLE_WIDTH = 64;
  const offset = (tabWidth - BUBBLE_WIDTH) / 2;

  const translateX = useRef(new Animated.Value(displayIndex * tabWidth + offset)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: displayIndex * tabWidth + offset,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [displayIndex, tabWidth, offset]);

  return (
    <View>
      <Animated.View
        style={[
          styles.semiCircle,
          {
            width: BUBBLE_WIDTH,
            backgroundColor: theme.background,
            elevation: 5,
            borderWidth: 1,
            borderColor: theme.primary,
            transform: [{ translateX }, { translateY }],
          },
        ]}
      />
      <ThemedView style={[styles.tabBarContainer, { backgroundColor: theme.background }]}>
        {visibleRoutes.map((route: any, index: number) => {
          const Icon = iconMap[route.name];
          if (!Icon) return null;

          const label = descriptors?.[route.key]?.options?.title ?? route.name;
          const isFocused = activeVisibleIndex === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
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

// BottomTabNavigator is removed, using expo-router Tabs directly in _layout.tsx

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