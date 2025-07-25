import { NavigationHeader, useTheme } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { filesDummyData } from "@/dummydata/filesData";
import { ResourceListCard } from "@/global/templates";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

export default function ProjectScreen(){
    
    const { theme } = useTheme();
    const globalStyles = useGlobalStyles();
    const { screenWidth, screenHeight } = useResponsiveDimensions();
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FileTypeCategory>('Tasks');
    
    type FileTypeCategory = 'Tasks' | 'Chats' | 'Events' | 'Resources';

    const categories: FileTypeCategory[] = ['Tasks', 'Chats', 'Events', 'Resources'];

    const responsiveStyles = StyleSheet.create({
        categorySelector: {
            width: screenWidth,
        },
        taskCard: {
            width: screenWidth - 40
        },
        chatContainer: {
            width: screenWidth - 40,
            height: screenHeight - 130,
            borderWidth: 1,
            borderColor: theme.border,
        },
        inputBar: {
            borderColor: theme.border
        }
    })

    const getCardLeftStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return {backgroundColor: '#2A52BE'};
            case 'completed':
                return {backgroundColor: '#2abe3bff'};
            case 'moderate':
                return {backgroundColor: '#be2a2aff'};
            case 'close':
                return {backgroundColor: '#bcbe2aff'};
            default:
            return { backgroundColor: '#ccc' }; // fallback style
        }
    };
    const getCardBackgroundStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return {backgroundColor: '#e7ebf5ff'};
            case 'completed':
                return {backgroundColor: '#e4f1e6ff'};
            case 'moderate':
                return {backgroundColor: '#f6ededff'};
            case 'close':
                return {backgroundColor: '#f4f4f2ff'};
            default:
            return { backgroundColor: '#ccc' }; // fallback style
        }
    };
    
    const tasks = [
        {
            id: '4556432',
            title: 'Literature review',
            description: 'First Descrip',
            dueDate: '25/02/2026',
            status: 'completed',
            assignedTo: 'user648329',
        },
        {
            id: '7335356',
            title: 'Data collection',
            description: 'First Descrip',
            dueDate: '25/02/2026',
            status: 'pending',
            assignedTo: 'user648329',
        },
        {
            id: '7890012',
            title: 'Transcribe interviews',
            description: 'Interview audio transcription',
            dueDate: '27/02/2026',
            status: 'moderate',
            assignedTo: 'user648329',
        },
        {
            id: '8123456',
            title: 'Prepare charts',
            description: 'Create visual data representations',
            dueDate: '28/02/2026',
            status: 'close',
            assignedTo: 'user648329',
        },
        {
            id: '9347563',
            title: 'Proofread manuscript',
            description: 'Final review of paper',
            dueDate: '01/03/2026',
            status: 'completed',
            assignedTo: 'user648329',
        },
        {
            id: '1342782',
            title: 'Run data analysis',
            description: 'Use SPSS to analyze data set',
            dueDate: '29/02/2026',
            status: 'pending',
            assignedTo: 'user648329',
        },
        {
            id: '2648273',
            title: 'Compile references',
            description: 'Format and organize bibliography',
            dueDate: '02/03/2026',
            status: 'moderate',
            assignedTo: 'user648329',
        },
        {
            id: '3782322',
            title: 'Team meeting',
            description: 'Discuss progress and assign next tasks',
            dueDate: '27/02/2026',
            status: 'pending',
            assignedTo: 'user648329',
        },
        {
            id: '4848473',
            title: 'Submit report draft',
            description: 'Send to supervisor',
            dueDate: '04/03/2026',
            status: 'close',
            assignedTo: 'user648329',
        },
        {
            id: '5901238',
            title: 'Edit figures',
            description: 'Update graphs and tables',
            dueDate: '03/03/2026',
            status: 'moderate',
            assignedTo: 'user648329',
        },
    ];

    const events = [
        {
            id: 'event001',
            title: 'Project Kick-off Meeting',
            date: '26/02/2026',
            startTime: '10:00 AM',
            endTime: '11:30 AM',
            location: 'Zoom',
            status: 'completed',
        },
        {
            id: 'event002',
            title: 'Midterm Presentation',
            date: '01/03/2026',
            startTime: '02:00 PM',
            endTime: '03:30 PM',
            location: 'Main Auditorium',
            status: 'pending',
        },
        {
            id: 'event003',
            title: 'Data Analysis Workshop',
            date: '28/02/2026',
            startTime: '09:00 AM',
            endTime: '12:00 PM',
            location: 'Lab 2B',
            status: 'moderate',
        },
        {
            id: 'event004',
            title: 'Draft Submission Deadline',
            date: '05/03/2026',
            startTime: '11:59 PM',
            endTime: '11:59 PM',
            location: 'Online Portal',
            status: 'close',
        },
        {
            id: 'event005',
            title: 'Final Project Defense',
            date: '10/03/2026',
            startTime: '10:00 AM',
            endTime: '01:00 PM',
            location: 'Engineering Conference Room',
            status: 'pending',
        },
    ];
    
    
    
    type ResourceFileTypeCategory = "Video" | "Image" | "Document" | "Audio" | "Other";
    
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
    
    const [selectedResourceCategory, setSelectedResourceCategory] = useState<
        ResourceFileTypeCategory | "All"
    >("All");
    const [currentPage, setCurrentPage] = useState(1);
    const filesPerPage = 10;
    
    const allCategories: (ResourceFileTypeCategory | "All")[] = [
        "All",
        "Video",
        "Image",
        "Document",
        "Audio",
        "Other",
    ];
    
    const categoryFilteredFiles =
        selectedResourceCategory === "All"
        ? files
        : files.filter((file) => {
            const ext = file.filepath.split(".").pop() || "";
            return getCategoryFromExtension(ext) === selectedResourceCategory;
            });
    
    //   const filteredFiles = categoryFilteredFiles.filter(
    //     (file) =>
    //       file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //       file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //       file.summary.toLowerCase().includes(searchQuery.toLowerCase())
    //   );
    
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedResourceCategory]);

    return(
        <ThemedView style={styles.page}>
            <NavigationHeader title="Project" />
            <ParallaxScrollView>
                <ThemedView style={[styles.categorySelector, responsiveStyles.categorySelector]}>
                    {categories.map(category => (
                        <Pressable
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive,
                            ]}
                        >
                            <ThemedText
                                style={[
                                styles.categoryButtonText,
                                globalStyles.baseText,
                                selectedCategory === category && { color: '#2A52BE' },
                                ]}
                            >
                                {category}
                            </ThemedText>
                        </Pressable>
                    ))}
                </ThemedView>
                <ThemedView>
                    {selectedCategory === 'Tasks' && (tasks.map(task => (
                        <ThemedView key={task.id} style={[styles.taskCard, responsiveStyles.taskCard, getCardBackgroundStyle(task.status)]}>
                            <ThemedView style={[ getCardLeftStyle(task.status), { width: 7, height: 58, borderBottomLeftRadius: 5, borderTopLeftRadius: 5 }]}>
                                
                            </ThemedView>
                            <View style={styles.taskCardRight}>
                                <ThemedText style={[styles.taskTitle, globalStyles.semiMediumText, { color: theme.text }]}>{task.title}</ThemedText>
                                <ThemedText style={globalStyles.semiMediumLightText} >Due: {task.dueDate}</ThemedText>
                            </View>
                            {/* <Pressable onPress={() => deleteTask(task.id)} style={styles.trashIconContainer} hitSlop={10}>
                                <FontAwesome6 name="trash" size={16} color={theme.icon} />
                            </Pressable> */}
                        </ThemedView>
                    )))}
                    {selectedCategory === 'Chats' && (
                        <ThemedView style={[styles.chatContainer, responsiveStyles.chatContainer]}>
                            <View style={styles.messagesContainer}>
                                {messages.length === 0 ? (
                                    <ThemedText style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
                                        No messages yet. Start the conversation!
                                    </ThemedText>
                                ) : (
                                    messages.map((msg, index) => (
                                    <View key={index} style={styles.messageBubble}>
                                        <ThemedText style={styles.messageText}>{msg}</ThemedText>
                                    </View>
                                    ))
                                )}
                            </View>

                            <View style={[styles.inputBar, responsiveStyles.inputBar]}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.textInput, { color: theme.text, }]}
                                        placeholder="Type a message..."
                                        placeholderTextColor="#999"
                                        value={newMessage}
                                        onChangeText={setNewMessage}
                                        returnKeyType="send"
                                        onSubmitEditing={() => {
                                            if (newMessage.trim() !== '') {
                                                setMessages(prev => [...prev, newMessage.trim()]);
                                                setNewMessage('');
                                            }
                                        }}
                                    />
                                </View>

                                <Pressable
                                    style={styles.sendButton}
                                    onPress={() => {
                                        if (newMessage.trim() !== '') {
                                            setMessages(prev => [...prev, newMessage.trim()]);
                                            setNewMessage('');
                                        }
                                    }}
                                >
                                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Send</ThemedText>
                                </Pressable>
                            </View>
                        </ThemedView>
                    )}
                    {selectedCategory === 'Events' && (events.map(event => (
                        <ThemedView key={event.id} style={[styles.taskCard, responsiveStyles.taskCard, ]}>
                            <ThemedView style={[ { width: 7, height: 50, borderBottomLeftRadius: 5, borderTopLeftRadius: 5, backgroundColor: '#2A52BE' }]}>
                                
                            </ThemedView>
                            <View style={styles.taskCardRight}>
                                <ThemedText style={[styles.taskTitle, globalStyles.semiMediumText, { color: theme.text }]}>{event.title}</ThemedText>
                                <ThemedText style={globalStyles.semiMediumLightText} >{event.startTime} - {event.endTime}</ThemedText>
                            </View>
                            {/* <Pressable onPress={() => deleteEvent(event.id)} style={styles.trashIconContainer} hitSlop={10}>
                                <FontAwesome6 name="trash" size={16} color={theme.icon} />
                            </Pressable> */}
                        </ThemedView>
                    )))}
                    {selectedCategory === 'Resources' && (
                        categoryFilteredFiles.map((resource, index) => (
                            <ResourceListCard key={index} file={resource} />
                        ))
                    )}
                </ThemedView>
            </ParallaxScrollView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        paddingBottom: 10,
    },
    categorySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    categoryButton: {
        backgroundColor: '#CCCCCC33',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(1, 119, 251, 0.1)',
    },
    categoryButtonText: {
        fontWeight: '500',
    },
    taskCard: {
        borderRadius: 6,
        marginBottom: 7,
        flexDirection: "row",
        gap: 9,
        alignItems: 'center'
    },
    taskCardRight: {
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    chatContainer: {
        borderRadius: 15,
        // padding: 10,
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        marginBottom: 10,
    },
    messageBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#e2e8f0',
        padding: 10,
        borderRadius: 10,
        marginBottom: 6,
        maxWidth: '80%',
    },
    messageText: {
        fontSize: 14,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    inputWrapper: {
        flex: 1,
        marginRight: 10,
    },
    textInput: {
        fontSize: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    sendButton: {
        backgroundColor: '#2A52BE',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
})