import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  GestureResponderEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface ScrollPickerColumnProps {
  data: number[];
  selected: number;
  onSelect: (item: number) => void;
  accentColor: string;
  textColor: string;
}

// ✅ Independent scrollable picker column
const ScrollPickerColumn: React.FC<ScrollPickerColumnProps> = ({
  data,
  selected,
  onSelect,
  accentColor,
  textColor,
}) => {
  const ITEM_HEIGHT = 40;
  const listRef = useRef<FlatList<number>>(null);

  // Scroll to selected item
  useEffect(() => {
    const index = data.indexOf(selected);
    if (index >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.5,
        });
      }, 0);
    }
  }, [selected, data]);

  const safeInitialIndex = data.includes(selected) ? data.indexOf(selected) : 0;

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => item.toString()}
      showsVerticalScrollIndicator={false}
      style={{ height: ITEM_HEIGHT * 5, width: 70 }}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={safeInitialIndex}
      onScrollToIndexFailed={(info) => {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
        });
      }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.option,
            { height: ITEM_HEIGHT, justifyContent: "center" },
            item === selected && { backgroundColor: accentColor },
          ]}
          onPress={() => onSelect(item)}
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
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      snapToAlignment="center"
    />
  );
};

// 🕒 Main Picker Component
const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  mode = "time",
  value = new Date(),
  visible,
  onClose,
  onChange,
  accentColor = "#2A52BE",
  textColor = "#333",
  selectedDate,
}) => {
  const [tempDate, setTempDate] = useState<Date>(value || selectedDate || new Date());
  const [pickerMode, setPickerMode] = useState<PickerMode>(mode);

  useEffect(() => {
    if (selectedDate) setTempDate(selectedDate);
  }, [selectedDate]);

  const handleConfirm = () => {
    onChange(null, tempDate);
    onClose();
  };

  const handleCancel = (event?: GestureResponderEvent) => {
    event?.stopPropagation?.();
    onClose();
  };

  const toggleMode = () => {
    setPickerMode((prev) => (prev === "time" ? "date" : "time"));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

  const setPart = (part: "hour" | "minute" | "day" | "month" | "year", val: number) => {
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: textColor }]}>
            {pickerMode === "time" ? "Select Time" : "Select Date"}
          </Text>

          {pickerMode === "time" ? (
            <View style={styles.pickerRow}>
              <ScrollPickerColumn
                data={hours}
                selected={tempDate.getHours()}
                onSelect={(val) => setPart("hour", val)}
                accentColor={accentColor}
                textColor={textColor}
              />
              <Text style={[styles.colon, { color: textColor }]}>:</Text>
              <ScrollPickerColumn
                data={minutes}
                selected={tempDate.getMinutes()}
                onSelect={(val) => setPart("minute", val)}
                accentColor={accentColor}
                textColor={textColor}
              />
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <ScrollPickerColumn
                data={days}
                selected={tempDate.getDate()}
                onSelect={(val) => setPart("day", val)}
                accentColor={accentColor}
                textColor={textColor}
              />
              <ScrollPickerColumn
                data={months}
                selected={tempDate.getMonth() + 1}
                onSelect={(val) => setPart("month", val)}
                accentColor={accentColor}
                textColor={textColor}
              />
              <ScrollPickerColumn
                data={years}
                selected={tempDate.getFullYear()}
                onSelect={(val) => setPart("year", val)}
                accentColor={accentColor}
                textColor={textColor}
              />
            </View>
          )}

          <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
            <Text style={{ color: accentColor, fontWeight: "600" }}>
              Switch to {pickerMode === "time" ? "Date" : "Time"}
            </Text>
          </TouchableOpacity>

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
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 18,
    textAlign: "center",
  },
  colon: {
    fontSize: 22,
    fontWeight: "600",
    marginHorizontal: 5,
  },
  toggleBtn: {
    alignSelf: "center",
    marginTop: 15,
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