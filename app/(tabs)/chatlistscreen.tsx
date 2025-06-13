import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedView } from '@/components/ThemedView';
import { useGlobalStyles } from '@/styles/globalStyles';


import { screenHeight, screenWidth } from '@/global/functions';

import { SearchBar } from '@/global/components';
import { ChatListCardTemplate } from '@/global/templates';


export default function ChatScreen() {
  const globalStyles = useGlobalStyles();

  const [searchText, setSearchText] = useState('');
  const chatData = [
    {
      id: '1',
      name: 'John Doe',
      message: 'Hey, how are you?',
      type: 'personal',
      time: '9:45 AM',
    },
    {
      id: '2',
      name: 'Study Group',
      message: 'Don’t forget our 4PM meeting!',
      type: 'group',
      time: '8:30 AM',
    },
    {
      id: '3',
      name: 'Jane Smith',
      message: 'I sent the slides.',
      type: 'personal',
      time: 'Yesterday',
    },
    {
      id: '4',
      name: 'Project Team',
      message: 'Code repo has been updated.',
      type: 'group',
      time: '2d ago',
    },
  ];

  const filteredChats = chatData.filter(chat =>
    chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
    chat.message.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ThemedView style={styles.page}>
      <NavigationHeader title="Messages" />
      <ParallaxScrollView>
        <SearchBar value={searchText} onChangeText={setSearchText} />

        <ThemedView style={styles.chatListContainer}>
          {filteredChats.map(chat => (
            <ChatListCardTemplate key={chat.id} chat={chat} />
          ))}
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}
const adjustedWidth = screenWidth - 30;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    height: screenHeight,
    gap: 10,
  },
  searchContainer: {
    width: adjustedWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  searchInput: {
    fontSize: 16,
    color: '#111',
  },
  chatListContainer: {
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});