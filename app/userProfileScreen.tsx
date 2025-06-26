import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<{ params: { chatId: string; chatName: string } }, 'params'>>();
  const { chatName } = route.params;

  return (
    <ThemedView style={styles.page}>
      <NavigationHeader title="User Profile" />
      <Image
        source={{ uri: 'https://placehold.co/100x100' }}
        style={[styles.avatar, {backgroundColor: "red",}]}
      />
      <ThemedText style={styles.name}>{chatName}</ThemedText>
      <ThemedText style={styles.info}>Status: Available</ThemedText>
      <ThemedText style={styles.info}>Last seen: Recently</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666',
  },
});