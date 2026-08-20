import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NavigationHeader, useTheme } from '@/components/Header';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';

export default function SubmissionReviewScreen() {
  const { submissionId } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Mock Data
  const submissionData = {
    studentName: 'Bob Smith',
    content: "This is a mock submission document content. In a real scenario, this would render a PDF or a text view of the student's work. The quick brown fox jumps over the lazy dog. AI Evaluation will read this text.",
    similarityScore: 12, // Plagiarism match %
  };

  const handleAIEvaluation = () => {
    setIsProcessingAI(true);
    // Simulate Cloud Function delay
    setTimeout(() => {
      setIsProcessingAI(false);
      setScore('88');
      setFeedback('The student demonstrated a good understanding of the core concepts. However, section 2 lacks depth. Consider referencing chapter 4. Plagiarism score is low (12%).');
    }, 2000);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title={`Review: ${submissionData.studentName}`} />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Document Viewer Mock */}
        <View style={[styles.documentViewer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <FontAwesome6 name="file-pdf" size={40} color="#F44336" style={{ alignSelf: 'center', marginBottom: 15 }} />
          <ThemedText style={{ color: theme.text, lineHeight: 22 }}>
            {submissionData.content}
          </ThemedText>
        </View>

        {/* Grading Section */}
        <ThemedView style={[styles.gradingSection, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, color: theme.text }}>Evaluation</ThemedText>
            <TouchableOpacity 
              style={styles.aiBtn}
              onPress={() => setShowAIOverlay(true)}
            >
              <FontAwesome6 name="wand-magic-sparkles" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>Auto-Grade</Text>
            </TouchableOpacity>
          </View>

          <ThemedText style={{ color: theme.text, marginBottom: 5 }}>Score (0-100)</ThemedText>
          <TextInput 
            style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
            keyboardType="number-pad"
            value={score}
            onChangeText={setScore}
            placeholder="e.g. 85"
            placeholderTextColor={theme.placeholder}
          />

          <ThemedText style={{ color: theme.text, marginBottom: 5, marginTop: 10 }}>Feedback / Rubric Notes</ThemedText>
          <TextInput 
            style={[styles.input, { color: theme.text, borderColor: theme.border, height: 100, textAlignVertical: 'top' }]} 
            multiline
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Enter feedback for the student..."
            placeholderTextColor={theme.placeholder}
          />

          <TouchableOpacity style={[styles.publishBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Publish Grade</Text>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* AI Automated Grading Overlay */}
      <Modal visible={showAIOverlay} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome6 name="robot" size={24} color="#2A52BE" />
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: theme.text }}>AI Evaluation</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowAIOverlay(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {isProcessingAI ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <FontAwesome6 name="spinner" size={40} color="#2A52BE" />
                <ThemedText style={{ marginTop: 20, color: theme.text }}>Analyzing rubric and matching text...</ThemedText>
              </View>
            ) : (
              <View>
                <ThemedText style={{ color: theme.text, marginBottom: 20 }}>
                  Ready to evaluate the document against the course rubric using Cloud Functions.
                </ThemedText>
                
                <View style={[styles.statsRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>{submissionData.similarityScore}%</Text>
                    <Text style={{ fontSize: 12, color: theme.placeholder }}>Text Match</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>--</Text>
                    <Text style={{ fontSize: 12, color: theme.placeholder }}>Suggested Score</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.publishBtn, { backgroundColor: '#2A52BE', marginTop: 20 }]} 
                  onPress={handleAIEvaluation}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Run AI Analysis</Text>
                </TouchableOpacity>

                {score !== '' && (
                  <View style={{ marginTop: 20, padding: 15, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 8 }}>
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: 5 }}>Analysis Complete!</Text>
                    <Text style={{ color: theme.text, fontSize: 12 }}>Suggested score and feedback have been populated. You can edit them before publishing.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 15, paddingBottom: 50 },
  documentViewer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    minHeight: 250,
    marginBottom: 20,
  },
  gradingSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishBtn: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  }
});
