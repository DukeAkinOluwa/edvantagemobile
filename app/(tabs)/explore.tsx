import { useLocalSearchParams } from "expo-router";
import OpenAI from "openai";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ⚠️ For testing only! Don’t hardcode your API key in production apps.
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_XAI_API_KEY || "YOUR_OPENAI_API_KEY",
  dangerouslyAllowBrowser: true, // needed for React Native / Expo
});

export default function AIChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "ai",
      time: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // 🔹 Call OpenAI API
  const getAIResponse = async (userMessage: string) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // small + fast + cheaper
        messages: [{ role: "user", content: userMessage }],
      });

      return response.choices[0].message.content || "Hmm, I couldn’t reply.";
    } catch (error) {
      console.error("OpenAI API Error:", error);
      return "Oops! Something went wrong.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Scroll to the latest message
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // 🔹 Get AI reply
    const aiResponseText = await getAIResponse(userMessage.text);
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      sender: "ai",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    console.log("Safe Area Insets:", insets);
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, [insets]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 50 : 20}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 20,
        }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === "me" ? styles.myMessage : styles.aiMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: insets.bottom ? insets.bottom : 10 },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask the AI..."
          style={[styles.input, { minHeight: 40 }]}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  aiMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  messageText: { fontSize: 14, color: "#000" },
  messageTime: {
    fontSize: 10,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginBottom: 25,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#25D366",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
