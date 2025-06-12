import { Dimensions, Pressable, StyleSheet, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Header } from '@react-navigation/elements';

import { useEffect, useState } from 'react';

import { filesDummyData } from '@/dummydata/filesData';
import { useGlobalStyles } from '@/styles/globalStyles';


const screenWidth = Dimensions.get('window').width;
const boundaryWidth = screenWidth - 10;

export default function ScheduleScreen() {

    const globalStyles = useGlobalStyles();

    const [searchQuery, setSearchQuery] = useState('');

    type FileTypeCategory = 'Video' | 'Image' | 'Document' | 'Audio' | 'Other';
    // type FileTypeCategory = 'Video' | 'Image' | 'Document' | 'Audio' | 'Archive' | 'Code' | 'Other';

    const files = filesDummyData

    type Props = {
        file: typeof filesDummyData[number];
    };

    const extensionCategories: { [key: string]: string[] } = {
        Video: ['mp4', 'm4a', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
        Image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'],
        Document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'odt'],
        Audio: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
        // Archive: ['zip', 'rar', '7z', 'tar', 'gz'],
        // Code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c'],
    };

    const getCategoryFromExtension = (ext: string): string => {
        const cleanedExt = ext.toLowerCase().replace('.', '');
        for (const category in extensionCategories) {
            if (extensionCategories[category].includes(cleanedExt)) {
                return category;
            }
        }
        return 'Other';
    };
    
    const FileTypeOption: React.FC<Props> = ({ file }) => {
        const extension = file.filepath.split('.').pop() || '';
        const category = getCategoryFromExtension(extension);

        return (
            <ThemedView style={styles.fileCard}>
                <ThemedView style={styles.fileCardHeading}>
                    <ThemedView style={styles.fileCardHeadingIcon}>

                    </ThemedView>
                    <ThemedView style={styles.fileCardHeadingTexts}>
                        <ThemedText style={[globalStyles.mediumText, {fontWeight: 500}]}>{file.filename}</ThemedText>
                        <ThemedText style={globalStyles.smallText}>{`Uploaded by ${file.uploadedBy}`}</ThemedText>
                    </ThemedView>
                </ThemedView>
                <ThemedView>
                    <ThemedText style={globalStyles.baseText}>{file.summary}</ThemedText>
                </ThemedView>
                <ThemedText style={globalStyles.baseText}>{`Likes: ${file.likes} | Downloads: ${file.downloads}`}</ThemedText>
            </ThemedView>
        );
    };

    const [selectedCategory, setSelectedCategory] = useState<FileTypeCategory | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const filesPerPage = 10;

    const allCategories: (FileTypeCategory | 'All')[] = ['All', 'Video', 'Image', 'Document', 'Audio', 'Other'];

    const categoryFilteredFiles = selectedCategory === 'All'
        ? files
        : files.filter(file => {
            const ext = file.filepath.split('.').pop() || '';
            return getCategoryFromExtension(ext) === selectedCategory;
        });

    const filteredFiles = categoryFilteredFiles.filter(file =>
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
        <>
            <Header title="Resources" />
            <ParallaxScrollView>
                <ThemedView style={[styles.searchContainer, { width: boundaryWidth }]}>
                    <TextInput
                        placeholder="Search by title, author, or summary"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                    />
                </ThemedView>
                <ThemedView style={styles.resourceFileTypeContainer}>
                    {allCategories.map((category, index) => (
                        <Pressable
                            key={index}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive
                            ]}
                        >
                            <ThemedText style={[
                                styles.categoryButtonText,
                                globalStyles.baseText,
                                selectedCategory === category && {color: "#2A52BE"},
                            ]}>
                                {category}
                            </ThemedText>
                        </Pressable>
                    ))}
                </ThemedView>
                <ThemedView style={styles.resourceList}>
                    {paginatedFiles.map((file, index) => {
                        const extension = file.filepath.split('.').pop() || '';
                        return <FileTypeOption key={index} file={file} />;
                    })}

                    <ThemedView style={styles.paginationContainer}>
                        <Pressable
                            disabled={currentPage === 1}
                            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        >
                            <ThemedText>Previous</ThemedText>
                        </Pressable>

                        <ThemedText>{`Page ${currentPage} of ${totalPages}`}</ThemedText>

                        <Pressable
                            disabled={currentPage === totalPages}
                            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                        >
                            <ThemedText>Next</ThemedText>
                        </Pressable>
                    </ThemedView>
                </ThemedView>
            </ParallaxScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    searchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        color: '#000',
    },
    resourceFileTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        padding: 10,
        justifyContent: 'flex-start',
    },
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(1, 119, 251, .1)',
    },
    categoryButtonText: {
        fontWeight: 500,
    },
    categoryTextActive: {
        color: '#2A52BE',
    },
    resourceList: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    fileCard: {
        marginBottom: 8,
        padding: 10,
        borderRadius: 6,
        gap: 10,
        maxWidth: boundaryWidth - 20,
    
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,

        // Android shadow
        elevation: 4,
    },
    fileCardHeading: {
        gap: 15,
        flexDirection: "row",
        alignItems: "center"
    },
    fileCardHeadingIcon: {
        width: 30,
        height: 30,
        backgroundColor: "#2A52BE80",
        borderRadius: 5,
    },
    fileCardHeadingTexts: {
        flexDirection: 'column'
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    paginationButton: {
        padding: 8,
        backgroundColor: '#2A52BE',
        borderRadius: 6,
    },
    paginationButtonDisabled: {
        backgroundColor: '#aaa',
    },
});