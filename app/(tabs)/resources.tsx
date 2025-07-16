import { Pressable, StyleSheet } from "react-native";

import { NavigationHeader, useTheme } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useEffect, useState } from "react";

import { filesDummyData } from "@/dummydata/filesData";
import { ResourceListCard } from "@/global/templates";
import { useGlobalStyles } from "@/styles/globalStyles";

import { SearchBar } from "@/global/components";

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();

  const [searchQuery, setSearchQuery] = useState("");

  type FileTypeCategory = "Video" | "Image" | "Document" | "Audio" | "Other";

  const files = filesDummyData;

  type Props = {
    file: (typeof filesDummyData)[number];
  };

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
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingBottom: 70, flex: 1 },
      ]}
    >
      <NavigationHeader title="Resources" />
      <ParallaxScrollView>
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
        <ThemedView
          style={[styles.resourceList, { backgroundColor: theme.background }]}
        >
          {paginatedFiles.map((file, index) => {
            const extension = file.filepath.split(".").pop() || "";
            return <ResourceListCard key={index} file={file} />;
          })}

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
                  { backgroundColor: theme.border || "#aaa" },
                ],
              ]}
            >
              <ThemedText style={{ color: theme.text }}>Previous</ThemedText>
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
                  { backgroundColor: theme.border || "#aaa" },
                ],
              ]}
            >
              <ThemedText style={{ color: theme.text }}>Next</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
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
    fontWeight: 500,
  },
  resourceList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 7,
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
});
