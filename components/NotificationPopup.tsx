import React from "react";
import { Modal, Text, View, Button, StyleSheet } from "react-native";
import { useTheme } from "../app/_layout";

interface Props {
  visible: boolean;
  task: { title: string } | null;
  onClose: () => void;
}

const NotificationPopup: React.FC<Props> = ({ visible, task, onClose }) => {
  const theme = useTheme();

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.popup, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Upcoming Event: {task.title}
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Your event "{task.title}" starts in 5 minutes!
          </Text>
          <Button title="Dismiss" onPress={onClose} color={theme.primary} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    marginBottom: 20,
  },
});

export default NotificationPopup;
