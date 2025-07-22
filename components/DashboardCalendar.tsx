import { useTheme } from "@/components/Header";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { cancelNotification } from "@/utils/notifications";
import { getData, saveData } from "@/utils/storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export interface Task {
    id: string;
    title: string;
    description: string;
    location: string;
    level: string;
    isGroupEvent: boolean;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    startTimeAMPM: string;
    endTimeAMPM: string;
}

interface Props {
    onDayPress?: (date: Date) => void;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Calendar: React.FC<Props> = ({ onDayPress }) => {
    const { theme } = useTheme();
    const { screenWidth } = useResponsiveDimensions();
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const globalStyles = useGlobalStyles()
    const router = useRouter();

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const adjustedWidth = screenWidth - 30;

    useFocusEffect(
        useCallback(() => {
        const loadTasks = async () => {
            const saved = await getData("tasks");
            setTasks(saved || []);
        };
        loadTasks();
        }, [])
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
        const date = new Date(task.startTime);
        return (
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
        );
        });
    }, [selectedDate, tasks]);

    const getMonthData = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
        const startPadding = Array(firstDay).fill(null);
        const endPadding = Array((7 - ((firstDay + totalDays) % 7)) % 7).fill(null);
        return [...startPadding, ...daysArray, ...endPadding];
    }, [year, month]);

    const isToday = (day: number) => {
        const now = new Date();
        return (
        day === now.getDate() &&
        month === now.getMonth() &&
        year === now.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        return (
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear()
        );
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate);
        onDayPress?.(newDate);
    };
    
    const deleteTask = async (taskId: string) => {
        const tasks = (await getData("tasks")) || [];
        const updatedTasks = tasks.filter((task: Task) => task.id !== taskId);
        await saveData("tasks", updatedTasks);
        await cancelNotification(taskId);
        setTasks(updatedTasks);
    };
    
    const dynamicStyles = StyleSheet.create({
        container: {
            width: adjustedWidth,
            backgroundColor: theme.background,
        },
        dayBox: {
            width: ((adjustedWidth - 60) / 7) - 2,
            marginHorizontal: 1
        },
        dayText: {
            width: (adjustedWidth - 60) / 7
        }
    })

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setCalendarDate(new Date(year, month - 1, 1))}>
                    <ThemedText style={{ color: theme.text }}>{"<"}</ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.headerText, globalStyles.semiLargeText, { color: theme.text }]}>
                    {monthNames[month]} {year}
                </ThemedText>
                <TouchableOpacity onPress={() => setCalendarDate(new Date(year, month + 1, 1))}>
                    <ThemedText style={{ color: theme.text }}>{">"}</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
                {daysOfWeek.map(day => (
                <ThemedText key={day} style={[styles.dayText, dynamicStyles.dayText, globalStyles.mediumText, { color: theme.text }]}>{day}</ThemedText>
                ))}
            </View>

            <View style={styles.days}>
                {getMonthData.map((day, idx) => (
                <TouchableOpacity
                    key={idx}
                    style={[
                        styles.dayBox,
                        dynamicStyles.dayBox,
                        isToday(day) && styles.todayBox,
                        isSelected(day) && { backgroundColor: theme.primary },
                        (isSelected(day) && isToday(day)) ? { borderColor: theme.primary } : { borderColor: "#2A52BE" }
                    ]}
                    onPress={() => day && handleDayPress(day)}
                    disabled={!day}
                >
                    <ThemedText style={[ globalStyles.baseText, isSelected(day) && { color: theme.secondary } ]}>{day ?? ""}</ThemedText>
                </TouchableOpacity>
                ))}
            </View>

            <View style={{ marginTop: 20 }}>
                <ThemedText style={[styles.taskHeader, globalStyles.mediumText, { color: theme.text }]}>
                    {selectedDate.toDateString()}
                </ThemedText>
                {filteredTasks.length === 0 ? (
                    <ThemedText style={[globalStyles.semiMediumLightText, { color: theme.text }]}>
                    No tasks created yet.
                    </ThemedText>
                ) : (filteredTasks.map(task => (
                    <View key={task.id} style={[styles.taskBox, { backgroundColor: theme.background }]}>
                        <ThemedView style={{ width: 7, height: 45, backgroundColor: "#2A52BE", borderBottomLeftRadius: 5, borderTopLeftRadius: 5 }}>
                            
                        </ThemedView>
                        <ThemedView style={styles.taskBoxRight}>
                            <ThemedText style={[styles.taskTitle, globalStyles.semiMediumText, { color: theme.text }]}>{task.title}</ThemedText>
                            <ThemedText style={[styles.taskTime, globalStyles.baseText, { color: theme.text }]}>
                                {task.startTimeAMPM} - {task.endTimeAMPM}
                            </ThemedText>
                        </ThemedView>
                        {/* <Pressable onPress={() => deleteTask(task.id)} style={styles.trashIconContainer} hitSlop={10}>
                            <FontAwesome6 name="trash" size={16} color={theme.icon} />
                        </Pressable> */}
                    </View>
                )))}
                {(filteredTasks.length >= 0) && (filteredTasks.length < 7) ? (
                    <></>
                ) : (
                    <Pressable style={[globalStyles.button2, { marginTop: 15, borderWidth: .5, borderColor: theme.tint }]} onPress={() => router.push("/schedule")}>
                        <ThemedText style={[ globalStyles.mediumText, globalStyles.actionText, ]}> See All </ThemedText>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

export default Calendar;

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "600",
    },
    weekDays: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    dayText: {
        textAlign: "center",
    },
    days: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    dayBox: {
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
        paddingVertical: 6
    },
    todayBox: {
        borderWidth: 1,
    },
    taskHeader: {
        fontSize: 16,
        marginBottom: 10,
    },
    taskBox: {
        borderRadius: 6,
        marginBottom: 7,
        flexDirection: "row",
        gap: 9,
    },
    taskBoxRight: {

    },
    taskTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    taskTime: {
        fontSize: 12,
    },
    trashIconContainer: {
        position: "absolute",
        top: 2,
        right: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
});