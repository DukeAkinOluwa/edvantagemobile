import React, { useState } from "react";
import { Modal, Text, View, Button, StyleSheet, Alert } from "react-native";
import { triggerAlarm } from "../utils/notifications";
import { useTheme } from "../app/_layout";

interface Props {
  visible: boolean;
  task: { id: string; title: string } | null;
  onDismiss: () => void;
}

const AlarmModal: React.FC<Props> = ({ visible, task, onDismiss }) => {
  const theme = useTheme();
  const [snoozeCount, setSnoozeCount] = useState(0);

  const handleSnooze = () => {
    if (snoozeCount >= 3) {
      Alert.alert("Snooze Limit", "Maximum snooze limit reached.");
      return;
    }
    setSnoozeCount(snoozeCount + 1);
    setTimeout(() => {
      if (task) triggerAlarm(task);
    }, 5 * 60 * 1000);
    onDismiss();
  };

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.popup, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Alarm: {task.title}
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Your event "{task.title}" is starting soon!
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Snooze (5 mins)"
              onPress={handleSnooze}
              color={theme.primary}
            />
            <Button title="Dismiss" onPress={onDismiss} color={theme.accent} />
          </View>
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default AlarmModal;
