import { Pressable, StyleSheet, Modal, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, Text, RefreshControl } from "react-native";
import { NavigationHeader } from "@/components/Header";
import { useTheme, useUserData } from "@/components/HeaderContext";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState, useCallback } from "react";
import { filesDummyData } from "@/dummydata/filesData";
import { ResourceListCard } from "@/global/templates";
import { useGlobalStyles } from "@/styles/globalStyles";
import { SearchBar } from "@/global/components";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { FontAwesome6 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

let hasAttemptedResourceSeed = false;

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const { userData } = useUserData();
  const globalStyles = useGlobalStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Upload modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileSummary, setNewFileSummary] = useState("");
  const [newFileType, setNewFileType] = useState("Document");
  const [isUploading, setIsUploading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  type FileTypeCategory = "Video" | "Image" | "Document" | "Audio" | "Other";

  // Fetch coursework uploads from Firestore
  useEffect(() => {
    setLoadingFiles(true);
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      
      // Auto-seed if database is completely empty
      if (list.length === 0 && !hasAttemptedResourceSeed) {
        hasAttemptedResourceSeed = true;
        console.log("No resources found in database. Seeding dummy data...");
        for (const file of filesDummyData) {
          try {
            await addDoc(collection(db, "resources"), {
              ...file,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Failed to seed file (likely Firebase Rules):", e);
          }
        }
      }
      
      setDbFiles(list);
      setLoadingFiles(false);
    }, (err) => {
      console.error("Failed to fetch resources:", err);
      setLoadingFiles(false);
    });
    return unsubscribe;
  }, []);

  // Merge Firestore uploads with client dummy files if DB is empty to guarantee UI has content
  const files = dbFiles.length > 0 ? dbFiles : [...dbFiles, ...filesDummyData];

  const extensionCategories: { [key: string]: string[] } = {
    Video: ["mp4", "m4a", "avi", "mov", "wmv", "flv", "mkv", "webm"],
    Image: ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp"],
    Document: [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "txt",
      "odt",
    ],
    Audio: ["mp3", "wav", "aac", "flac", "ogg"],
  };

  const getCategoryFromExtension = (ext: string): string => {
    const cleanedExt = ext.toLowerCase().replace(".", "");
    for (const category in extensionCategories) {
      if (extensionCategories[category].includes(cleanedExt)) {
        return category;
      }
    }
    return "Other";
  };

  const [selectedCategory, setSelectedCategory] = useState<
    FileTypeCategory | "All"
  >("All");
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;

  const allCategories: (FileTypeCategory | "All")[] = [
    "All",
    "Video",
    "Image",
    "Document",
    "Audio",
    "Other",
  ];

  const categoryFilteredFiles =
    selectedCategory === "All"
      ? files
      : files.filter((file) => {
          const ext = file.filepath.split(".").pop() || "";
          return getCategoryFromExtension(ext) === selectedCategory;
        });

  const filteredFiles = categoryFilteredFiles.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / filesPerPage));

  const handleUpload = async () => {
    if (!newFileName.trim()) {
      Alert.alert("Error", "Please enter a file name.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = newFileType === "Video" ? ".mp4" : newFileType === "Audio" ? ".mp3" : newFileType === "Image" ? ".jpg" : ".pdf";
      const mockPath = `/mock/resources/${newFileName.trim().toLowerCase().replace(/\s+/g, "_")}${ext}`;
      
      await addDoc(collection(db, "resources"), {
        filename: newFileName.trim(),
        filepath: mockPath,
        uploadedBy: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : "Lecturer",
        summary: newFileSummary.trim() || "No description provided.",
        createdAt: new Date().toISOString(),
      });

      setUploadModalVisible(false);
      setNewFileName("");
      setNewFileSummary("");
      Alert.alert("Success", "Coursework uploaded successfully!");
    } catch (e) {
      console.error("Upload error:", e);
      Alert.alert("Error", "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingBottom: 70, flex: 1 },
      ]}
    >
      <NavigationHeader title="Resources" />
      <ParallaxScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
          }}
          inputStyle={{ color: theme.text }}
          placeholderTextColor={theme.border}
        />

        {/* Lecturer Upload Action */}
        {userData.role === "lecturer" && (
          <TouchableOpacity
            style={[styles.uploadBanner, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => setUploadModalVisible(true)}
          >
            <FontAwesome6 name="file-circle-plus" size={24} color="#2A52BE" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: "bold", fontSize: 15 }}>Upload Coursework</ThemedText>
              <ThemedText style={{ color: theme.placeholder, fontSize: 11 }}>Add PDFs, lecture slides, or media files for students.</ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.placeholder} />
          </TouchableOpacity>
        )}

        <ThemedView
          style={[
            styles.resourceFileTypeContainer,
            { backgroundColor: theme.background },
          ]}
        >
          {allCategories.map((category, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryButton,
                selectedCategory === category && [
                  styles.categoryButtonActive,
                  {
                    backgroundColor:
                      theme.backgroundSecondary || "rgba(1, 119, 251, 0.1)",
                  },
                ],
              ]}
            >
              <ThemedText
                style={[
                  styles.categoryButtonText,
                  globalStyles.baseText,
                  { color: theme.text },
                  selectedCategory === category && {
                    color: theme.primary || "#2A52BE",
                  },
                ]}
              >
                {category}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        {loadingFiles && dbFiles.length === 0 ? (
          <ActivityIndicator size="large" color="#2A52BE" style={{ marginVertical: 20 }} />
        ) : (
          <ThemedView
            style={[styles.resourceList, { backgroundColor: theme.background }]}
          >
            {paginatedFiles.map((file, index) => (
              <ResourceListCard key={index} file={file} />
            ))}

            <ThemedView
              style={[
                styles.paginationContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Pressable
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={[
                  styles.paginationButton,
                  { backgroundColor: theme.primary || "#2A52BE" },
                  currentPage === 1 && [
                    styles.paginationButtonDisabled,
                    { backgroundColor: "rgba(1, 119, 251, 0.1)" },
                  ],
                ]}
              >
                <ThemedText style={[{ color: theme.secondary },
                  currentPage === 1 && {color: theme.primary}
                ]}>Previous</ThemedText>
              </Pressable>

              <ThemedText
                style={{ color: theme.text }}
              >{`Page ${currentPage} of ${totalPages}`}</ThemedText>

              <Pressable
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                style={[
                  styles.paginationButton,
                  { backgroundColor: theme.primary || "#2A52BE" },
                  currentPage === totalPages && [
                    styles.paginationButtonDisabled,
                    { backgroundColor: 'rgba(1, 119, 251, 0.1)' },
                  ],
                ]}
              >
                <ThemedText style={[{ color: theme.secondary },
                  currentPage === totalPages && {color: theme.primary}
                ]}>Next</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}
      </ParallaxScrollView>

      {/* Lecturer Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Upload Coursework</ThemedText>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Resource Title (e.g. Intro to UI Design)"
              placeholderTextColor={theme.placeholder}
              value={newFileName}
              onChangeText={setNewFileName}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Summary/Description"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={3}
              value={newFileSummary}
              onChangeText={setNewFileSummary}
            />

            <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: theme.text }}>Resource Type</ThemedText>
            <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginBottom: 15, overflow: "hidden" }}>
              <Picker
                selectedValue={newFileType}
                onValueChange={(val) => setNewFileType(val)}
                style={{ color: theme.text, backgroundColor: theme.background }}
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="Document (PDF, Doc)" value="Document" />
                <Picker.Item label="Video Lecture" value="Video" />
                <Picker.Item label="Audio Lecture" value="Audio" />
                <Picker.Item label="Image Asset" value="Image" />
                <Picker.Item label="Other File" value="Other" />
              </Picker>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                onPress={() => setUploadModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.primary }, isUploading && { opacity: 0.6 }]}
                onPress={handleUpload}
                disabled={isUploading}
              >
                <Text style={[styles.btnText, { color: theme.secondary }]}>
                  {isUploading ? "Uploading..." : "Publish"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resourceFileTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    padding: 10,
    justifyContent: "flex-start",
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  categoryButtonActive: {
    backgroundColor: "rgba(1, 119, 251, .1)",
  },
  categoryButtonText: {
    fontWeight: "500",
  },
  resourceList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: "#aaa",
  },
  uploadBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
