import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { NavigationHeader, useTheme } from '@/components/Header';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const MOCK_ASSIGNMENTS = [
  { id: '1', title: 'React Native Components', courseCode: 'CS401', dueDate: '2026-08-20', submissions: 45, totalStudents: 50 },
  { id: '2', title: 'Data Structures Implementation', courseCode: 'CS305', dueDate: '2026-08-25', submissions: 12, totalStudents: 40 },
];

export default function AssignmentsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const isLecturer = profile?.role === 'lecturer';

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Assignments" />
      <FlatList
        data={MOCK_ASSIGNMENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => router.push(`/assignments/${item.id}`)}
          >
            <View style={styles.headerRow}>
              <ThemedText style={styles.courseCode}>{item.courseCode}</ThemedText>
              <ThemedText style={[styles.dueDate, { color: theme.placeholder }]}>Due: {item.dueDate}</ThemedText>
            </View>
            <ThemedText style={[styles.title, { color: theme.text }]}>{item.title}</ThemedText>
            
            {isLecturer && (
              <View style={styles.statsRow}>
                <FontAwesome6 name="file-arrow-up" size={14} color={theme.primary} />
                <ThemedText style={{ marginLeft: 6, color: theme.text }}>
                  {item.submissions} / {item.totalStudents} Submitted
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 15, paddingBottom: 50 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  courseCode: { fontWeight: 'bold', color: '#2A52BE', fontSize: 13 },
  dueDate: { fontSize: 12 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
