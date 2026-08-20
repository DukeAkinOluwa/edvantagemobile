import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NavigationHeader, useTheme } from '@/components/Header';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome6 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

const MOCK_SUBMISSIONS = [
  { id: 'sub_1', studentName: 'Alice Johnson', studentId: 'stu_1', status: 'Graded', score: 85, submittedAt: '2026-08-18 14:00' },
  { id: 'sub_2', studentName: 'Bob Smith', studentId: 'stu_2', status: 'Pending Review', score: null, submittedAt: '2026-08-19 09:30' },
  { id: 'sub_3', studentName: 'Charlie Davis', studentId: 'stu_3', status: 'Late', score: null, submittedAt: '2026-08-21 11:15' },
];

export default function AssignmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const isLecturer = profile?.role === 'lecturer';
  
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to pick document.");
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    Alert.alert("Success", "Your assignment has been submitted successfully (Mocked).", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  if (!isLecturer) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <NavigationHeader title="Submit Assignment" />
        <View style={styles.content}>
          <ThemedText style={{ color: theme.text, fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
            Upload your work for Assignment {id}
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.uploadBtn, { backgroundColor: theme.primary }]}
            onPress={handlePickFile}
          >
            <FontAwesome6 name="cloud-arrow-up" size={40} color={theme.secondary} />
            <Text style={{ color: theme.secondary, marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>Select File</Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={[styles.fileInfoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <FontAwesome6 name="file-lines" size={24} color={theme.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={{ fontWeight: 'bold', color: theme.text }} numberOfLines={1}>{selectedFile.name}</ThemedText>
                <ThemedText style={{ color: theme.placeholder, fontSize: 12 }}>
                  {(selectedFile.size ?? 0) > 1024 * 1024 ? `${((selectedFile.size ?? 0) / (1024 * 1024)).toFixed(2)} MB` : `${((selectedFile.size ?? 0) / 1024).toFixed(2)} KB`}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <FontAwesome6 name="xmark" size={16} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          )}

          {selectedFile && (
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: '#4CAF50' }]}
              onPress={handleSubmit}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit Assignment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    );
  }

  // Lecturer View: Submissions List
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title={`Submissions: Assignment ${id}`} />
      
      <View style={{ paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>All Submissions</ThemedText>
        <TouchableOpacity style={{ padding: 8, backgroundColor: theme.backgroundSecondary, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.primary, fontSize: 12 }}>Edit Rubric</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_SUBMISSIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => router.push(`/assignments/review/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.studentName, { color: theme.text }]}>{item.studentName}</ThemedText>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.status === 'Graded' ? 'rgba(76, 175, 80, 0.2)' : item.status === 'Late' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 152, 0, 0.2)' }
              ]}>
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  color: item.status === 'Graded' ? '#4CAF50' : item.status === 'Late' ? '#F44336' : '#FF9800' 
                }}>{item.status}</Text>
              </View>
            </View>
            <ThemedText style={[styles.submittedAt, { color: theme.placeholder }]}>Submitted: {item.submittedAt}</ThemedText>
            
            {item.score !== null && (
              <ThemedText style={{ color: theme.text, marginTop: 8, fontWeight: 'bold' }}>Score: {item.score}/100</ThemedText>
            )}
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { width: 200, height: 150, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  fileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  list: { padding: 15 },
  card: { borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  submittedAt: { fontSize: 12 },
});
