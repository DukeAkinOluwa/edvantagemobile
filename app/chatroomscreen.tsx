import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGlobalStyles } from '@/styles/globalStyles';

const messagesMock = [
  { id: '1', sender: 'me', text: 'Hey!' },
  { id: '2', sender: 'them', text: 'Hi, how’s it going?' },
  { id: '3', sender: 'me', text: 'All good. You?' },
  { id: '4', sender: 'them', text: 'Same here.' },
];

export default function ChatRoomScreen() {
  const globalStyles = useGlobalStyles();
  const route = useRoute<RouteProp<{ params: { chatId: string; chatName: string } }, 'params'>>();
  const { chatName } = route.params;

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
      <NavigationHeader title={chatName} />

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
    backgroundColor: '#DCF8C6',
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
});