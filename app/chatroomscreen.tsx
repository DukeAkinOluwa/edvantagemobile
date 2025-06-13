import profileImage from '@/assets/images/dummy/Titilayo.jpg';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGlobalStyles } from '@/styles/globalStyles';

import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, TouchableOpacity } from 'react-native';

const messagesMock = [
  { id: '1', sender: 'me', text: 'Hey!' },
  { id: '2', sender: 'them', text: 'Hi, how’s it going?' },
  { id: '3', sender: 'me', text: 'All good. You?' },
  { id: '4', sender: 'them', text: 'Same here.' },
];

export default function ChatRoomScreen() {
  const globalStyles = useGlobalStyles();
  const route = useRoute<RouteProp<{ params: { chatId: string; chatName: string } }, 'params'>>();
  const { chatName, chatId } = route.params;
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState(messagesMock);
  const [input, setInput] = useState('');
  

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = { id: String(Date.now()), sender: 'me', text: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  return (
    <ThemedView style={styles.page}>
      <ThemedView style={styles.profileHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
          <FontAwesome name="angle-left" size={24} color="#2A52BE" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('userProfileScreen', { chatId, chatName })}
          style={styles.profileInfo}
        >
          <Image
            source={profileImage}
            style={styles.avatar}
          />
          <ThemedText style={globalStyles.semiMediumText}>
            {chatName}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <ThemedView style={[styles.messageBubble, item.sender === 'me' ? styles.sent : styles.received]}>
            <ThemedText style={globalStyles.smallText}>{item.text}</ThemedText>
          </ThemedView>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#999"
        />
        <ThemedText style={styles.sendButton} onPress={handleSend}>Send</ThemedText>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingBottom: 10,
  },
  backArrowContainer: {
    height: 35,
    width: 35,
    borderRadius: 8,
    backgroundColor: 'rgba(1, 119, 251, .1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    padding: 15,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 10,
    padding: 10,
  },
  sent: {
    backgroundColor: 'rgba(1, 119, 251, .1)',
    alignSelf: 'flex-end',
  },
  received: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderColor: '#DDD',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  sendButton: {
    marginLeft: 10,
    fontWeight: '600',
    color: '#2A52BE',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
    paddingTop: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

});