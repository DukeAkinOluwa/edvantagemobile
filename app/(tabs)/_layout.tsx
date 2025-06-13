import React from 'react';

import BottomTabNavigator from '@/components/BottomTabNavigator';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const theme = useColorScheme() ?? 'light';
    const colorSet = Colors[theme];

  return (
    <BottomTabNavigator />
  );
}
