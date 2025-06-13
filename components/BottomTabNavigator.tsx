import { FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ChatListScreen from '@/app/(tabs)/chatlistscreen';
import ExploreScreen from '@/app/(tabs)/explore';
import HomeScreen from '@/app/(tabs)/index';
import ResourcesScreen from '@/app/(tabs)/resources';
import ScheduleScreen from '@/app/(tabs)/schedule';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const theme = useColorScheme() ?? 'light';
  const colorSet = Colors[theme];

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;

        const isFocused = state.index === index;

        type RouteName = 'index' | 'schedule' | 'chatlistscreen' | 'resources' | 'explore';

        const iconMap: Record<RouteName, keyof typeof FontAwesome.glyphMap> = {
        index: 'home',
        schedule: 'calendar',
        chatlistscreen: 'comment',
        resources: 'book',
        explore: 'plane',
        };

        // Cast route.name as RouteName
        const iconName = iconMap[route.name as RouteName];

        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            onPress={onPress}
            style={styles.tabButton}
          >
            <FontAwesome
              name={iconName}
              size={isFocused ? 28 : 22}
              color={isFocused ? colorSet.primary : 'gray'}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? colorSet.primary : 'gray' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
      <Tab.Navigator
        initialRouteName="index"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="index" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="schedule" component={ScheduleScreen} options={{ title: 'Schedule' }} />
        <Tab.Screen name="chatlistscreen" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Tab.Screen name="resources" component={ResourcesScreen} options={{ title: 'Resources' }} />
        <Tab.Screen name="explore" component={ExploreScreen} options={{ title: 'Explore' }} />
      </Tab.Navigator>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
});