import React, { useEffect, useState } from "react";
import {
  FlatList,
  GestureResponderEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🧩 Types
export type PickerMode = "time" | "date";

export interface CustomDateTimePickerProps {
  mode?: PickerMode;
  value?: Date;
  visible: boolean;
  onChange: (event: unknown, date: Date) => void;
  onClose: () => void;
  accentColor?: string;
  textColor?: string;
  selectedDate?: Date;
}

// ✅ Component
const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  mode = "time",
  value = new Date(),
  visible,
  onClose,
  onChange,
  accentColor = "#2A52BE",
  textColor = "#333",
  selectedDate
}) => {
  const [tempDate, setTempDate] = useState<Date>(value || selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) setTempDate(selectedDate);
  }, [selectedDate]);

  const handleConfirm = (): void => {
    onChange(null, tempDate);
    onClose();
  };

  const handleCancel = (event?: GestureResponderEvent): void => {
    event?.stopPropagation?.();
    onClose();
  };

  // ⏱ Time / 📅 Date Arrays
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 50 }, (_, i) => 2000 + i);

  const setPart = (part: "hour" | "minute" | "day" | "month" | "year", val: number): void => {
    const newDate = new Date(tempDate);
    switch (part) {
      case "hour":
        newDate.setHours(val);
        break;
      case "minute":
        newDate.setMinutes(val);
        break;
      case "day":
        newDate.setDate(val);
        break;
      case "month":
        newDate.setMonth(val - 1);
        break;
      case "year":
        newDate.setFullYear(val);
        break;
    }
    setTempDate(newDate);
  };

  // Generic Render Function
  const renderOption = (
    data: number[],
    selected: number,
    onPress: (item: number) => void
  ) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.option,
            item === selected && { backgroundColor: accentColor },
          ]}
          onPress={() => onPress(item)}
        >
          <Text
            style={[
              styles.optionText,
              { color: textColor },
              item === selected && { color: "#fff", fontWeight: "700" },
            ]}
          >
            {item.toString().padStart(2, "0")}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: textColor }]}>
            {mode === "time" ? "Select Time" : "Select Date"}
          </Text>

          {mode === "time" ? (
            <View style={styles.pickerRow}>
              {renderOption(hours, tempDate.getHours(), (val) => setPart("hour", val))}
              <Text style={[styles.colon, { color: textColor }]}>:</Text>
              {renderOption(minutes, tempDate.getMinutes(), (val) => setPart("minute", val))}
            </View>
          ) : (
            <View style={styles.pickerRow}>
              {renderOption(days, tempDate.getDate(), (val) => setPart("day", val))}
              {renderOption(months, tempDate.getMonth() + 1, (val) => setPart("month", val))}
              {renderOption(years, tempDate.getFullYear(), (val) => setPart("year", val))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: accentColor }]}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomDateTimePicker;

// 🎨 Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  option: {
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 18,
  },
  colon: {
    fontSize: 22,
    fontWeight: "600",
    marginHorizontal: 5,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  cancelBtn: {
    padding: 10,
  },
  confirmBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelText: {
    color: "#555",
  },
});