import React, { useState } from "react";
import { StyleSheet } from "react-native";

import { NavigationHeader, useTheme } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";

import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";

import { SearchBar } from "@/global/components";
import { ChatListCardTemplate } from "@/global/templates";
import { useRouter } from "expo-router";

export default function ChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const { screenHeight, screenWidth } = useResponsiveDimensions();

  const [searchText, setSearchText] = useState("");
  const chatData = [
    {
      id: "1",
      name: "John Doe",
      message: "Hey, how are you?",
      type: "personal",
      time: "9:45 AM",
    },
    {
      id: "2",
      name: "Study Group",
      message: "Don’t forget our 4PM meeting!",
      type: "group",
      time: "8:30 AM",
    },
    {
      id: "3",
      name: "Jane Smith",
      message: "I sent the slides.",
      type: "personal",
      time: "Yesterday",
    },
    {
      id: "4",
      name: "Project Team",
      message: "Code repo has been updated.",
      type: "group",
      time: "2d ago",
    },
  ];

  const filteredChats = chatData.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Messages" />
      <ParallaxScrollView>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
          inputStyle={{ color: theme.text }}
          placeholderTextColor={theme.border}
        />
        <ThemedView
          style={[
            styles.chatListContainer,
            { backgroundColor: theme.background },
          ]}
        >
          {filteredChats.map((chat) => (
            <ChatListCardTemplate
              key={chat.id}
              chat={chat}
              onPress={() => router.push(`/chat/${chat.id}`)}
            />
          ))}
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    gap: 10,
    flex: 1,
    paddingBottom: 70, // Adjusted for Bottom Nav
  },
  searchInput: {
    fontSize: 16,
    color: "#111",
  },
  chatListContainer: {
    flexDirection: "column",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
