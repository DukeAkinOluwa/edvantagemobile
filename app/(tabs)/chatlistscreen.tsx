import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Modal, Pressable, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';

import { SearchBar } from '@/global/components';
import {
    ChatListCardTemplate,
    ProjectCardTemplate,
    ProjectItem,
    StudyCardTemplate
} from '@/global/templates';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from "expo-image-picker";

export default function ChatScreen() {
    const router = useRouter();
    const globalStyles = useGlobalStyles();
    const { screenWidth, screenHeight } = useResponsiveDimensions();
    const [showFormModal, setShowFormModal] = useState(false);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [description, setDescription] = useState('');
    const [generalChatType, setGeneralChatType] = useState<'Personal' | 'Group'>('Personal');
    const [dueDate, setDueDate] = useState('');
    const [imageLink, setImageLink] = useState('');
    const [members, setMembers] = useState<string[]>([]);

    const [showMemberSlide, setShowMemberSlide] = useState(false);
    const [searchUsername, setSearchUsername] = useState('');
    const [foundUsers, setFoundUsers] = useState<string[]>([]); // mock usernames for now



    // --- Types ---
    interface PersonalOrGroupChat {
        id: string;
        name: string;
        message: string;
        type: 'Personal' | 'Group';
        time: string;
        imageLink: string;
    }

    interface StudyGroup {
        id: string;
        title: string;
        description: string;
        type: 'Study';
        imageLink: string;
        members: string[];
    }

    type FileTypeCategory = 'General' | 'Study' | 'Projects';

    // --- States ---
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FileTypeCategory>('General');

    // --- Sample Data ---
    const personalChats: PersonalOrGroupChat[] = [
        { id: '1', name: 'John Doe', message: 'Hey, how are you?', type: 'Personal', time: '9:45 AM', imageLink: 'https://i.pravatar.cc/150?img=5' },
        { id: '2', name: 'Study Group', message: 'Don’t forget our 4PM meeting!', type: 'Group', time: '8:30 AM', imageLink: 'https://i.pravatar.cc/150?img=4' },
        { id: '3', name: 'Jane Smith', message: 'I sent the slides.', type: 'Personal', time: 'Yesterday', imageLink: 'https://i.pravatar.cc/150?img=3' },
        { id: '4', name: 'Project Team', message: 'Code repo has been updated.', type: 'Group', time: '2d ago', imageLink: 'https://i.pravatar.cc/150?img=2' },
    ];

    const studyGroups: StudyGroup[] = [
        { 
            id: '13434232',
            title: 'CS 301 Study Group',
            description: 'For students taking Data Structures and Algorithms this semester.',
            type: 'Study',
            imageLink: '/assets/images/dummy/Titilayo.jpg',
            members: ['98245', '43849', '49380', '32498', '98433'],
        },
    ];

    const projects: ProjectItem[] = [
        {
            id: '34324',
            title: 'Advanced Machine Learning Research',
            description: 'Research project on implementing advanced ML algorithms for educational pattern recognition',
            dueDate: '25/03/2026',
            priority: 'high',
            tasks: [
                {
                    title: 'Literature review',
                    description: 'First Descrip',
                    dueDate: '25/02/2026',
                    status: 'completed',
                    assignedTo: 'user648329',
                },
                {
                    title: 'Data collection',
                    description: 'First Descrip',
                    dueDate: '25/02/2026',
                    status: 'pending',
                    assignedTo: 'user648329',
                }
            ],
            type: 'Projects',
            imageLink: '/assets/images/dummy/Titilayo.jpg',
            members: ['98245', '43849', '49380', '32498', '98433'],
        },
    ];

    const categories: FileTypeCategory[] = ['General', 'Study', 'Projects'];

    // --- Filtering ---
    const filteredList =
        selectedCategory === 'General'
        ? personalChats.filter(chat =>
            chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
            chat.message.toLowerCase().includes(searchText.toLowerCase())
            )
        : selectedCategory === 'Study'
        ? studyGroups.filter(group =>
            group.title.toLowerCase().includes(searchText.toLowerCase()) ||
            group.description.toLowerCase().includes(searchText.toLowerCase())
            )
        : projects.filter(project =>
            project.title.toLowerCase().includes(searchText.toLowerCase()) ||
            project.description.toLowerCase().includes(searchText.toLowerCase())
            );

    // --- Styles ---
    const responsiveStyles = StyleSheet.create({
        categorySelector: {
            width: screenWidth,
        },
        listContainer: {
            height: screenHeight - 200,
        }
    })

    const handleAddCommunication = () => {
        const id = Date.now().toString();

        if (selectedCategory === 'General') {
            const newChat: PersonalOrGroupChat = {
            id,
            name,
            message,
            type: generalChatType,
            time: new Date().toLocaleTimeString(),
            imageLink: imageLink || 'https://i.pravatar.cc/150?img=7',
            };
            personalChats.unshift(newChat);
        } else if (selectedCategory === 'Study') {
            const newStudy: StudyGroup = {
            id,
            title: name,
            description,
            type: 'Study',
            imageLink: imageLink || 'https://i.pravatar.cc/150?img=8',
            members,
            };
            studyGroups.unshift(newStudy);
        } else if (selectedCategory === 'Projects') {
            const newProject: ProjectItem = {
            id,
            title: name,
            description,
            dueDate,
            priority: 'low',
            tasks: [],
            type: 'Projects',
            imageLink: imageLink || 'https://i.pravatar.cc/150?img=9',
            members,
            };
            projects.unshift(newProject);
        }

        // Clear form
        setName('');
        setDescription('');
        setDueDate('');
        setMessage('');
        setImageLink('');
        setMembers([]);
        setShowFormModal(false);
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImageLink(result.assets[0].uri);
        }
    };


    // --- Render ---
    return (
        <ThemedView style={styles.page}>
            <NavigationHeader title="Messages" />
            <ParallaxScrollView>
                <SearchBar value={searchText} onChangeText={setSearchText} />

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
                <ThemedView style={[ styles.listContainer ]}>
                    {selectedCategory === 'General' &&
                        (filteredList as PersonalOrGroupChat[]).map(chat => (
                            <ChatListCardTemplate
                                key={chat.id}
                                chat={chat}
                                onPress={() => router.push(`/chat/${chat.id}`)}
                            />
                        ))
                    }
                    {selectedCategory === 'Study' &&
                        (filteredList as StudyGroup[]).map(study => (
                            <StudyCardTemplate
                                key={study.id}
                                studyGroup={study}
                                onPress={() => router.push(`/study/${study.id}`)}
                            />
                        ))
                    }
                    {selectedCategory === 'Projects' &&
                        (filteredList as ProjectItem[]).map(project => (
                            <ProjectCardTemplate
                                key={project.id}
                                project={project}
                                onPress={() => router.push(`/projects/${project.id}`)}
                            />
                        ))
                    }
                </ThemedView>
                <Modal visible={showFormModal} animationType="slide" transparent>
                    <ThemedView style={styles.modalOverlay}>
                        <ThemedView style={styles.modalContent}>
                        <ThemedText style={styles.modalTitle}>
                            Add {selectedCategory === 'General' ? 'Chat' : selectedCategory}
                        </ThemedText>

                        {selectedCategory === 'General' && (
                            <>
                            <Picker
                                selectedValue={generalChatType}
                                onValueChange={(val) => setGeneralChatType(val)}
                            >
                                <Picker.Item label="Personal" value="Personal" />
                                <Picker.Item label="Group" value="Group" />
                            </Picker>
                            <TextInput placeholder="Name" style={styles.input} onChangeText={setName} />
                            <TextInput placeholder="Message" style={styles.input} onChangeText={setMessage} />
                            </>
                        )}

                        {selectedCategory === 'Study' && (
                            <>
                            <TextInput placeholder="Title" style={styles.input} onChangeText={setName} />
                            <TextInput placeholder="Description" style={styles.input} onChangeText={setDescription} />
                            <Button title="Upload Image" onPress={handleImagePick} />
                            <Button title="Add Members" onPress={() => setShowMemberSlide(true)} />
                            </>
                        )}

                        {selectedCategory === 'Projects' && (
                            <>
                            <TextInput placeholder="Title" style={styles.input} onChangeText={setName} />
                            <TextInput placeholder="Description" style={styles.input} onChangeText={setDescription} />
                            <TextInput placeholder="Due Date" style={styles.input} onChangeText={setDueDate} />
                            <Button title="Upload Image" onPress={handleImagePick} />
                            <Button title="Add Members" onPress={() => setShowMemberSlide(true)} />
                            </>
                        )}

                        <ThemedView style={styles.modalButtonRow}>
                            <Button title="Cancel" color="grey" onPress={() => setShowFormModal(false)} />
                            <Button title="Save" onPress={handleAddCommunication} />
                        </ThemedView>
                        </ThemedView>
                    </ThemedView>
                </Modal>
                <Modal visible={showMemberSlide} animationType="slide">
                    <ThemedView style={styles.modalContent}>
                        <ThemedText style={styles.modalTitle}>Add Members by Username</ThemedText>
                        <TextInput
                        placeholder="Search by username"
                        style={styles.input}
                        value={searchUsername}
                        onChangeText={(text) => {
                            setSearchUsername(text);
                            // Mock search logic (replace with backend/API)
                            setFoundUsers(['john_doe', 'susan123', 'timmy'].filter(user => user.includes(text)));
                        }}
                        />
                        {foundUsers.map((user) => (
                        <Pressable key={user} onPress={() => {
                            if (!members.includes(user)) setMembers([...members, user]);
                        }}>
                            <ThemedText>{user}</ThemedText>
                        </Pressable>
                        ))}

                        <ThemedText>Selected Members: {members.join(', ')}</ThemedText>
                        <Button title="Done" onPress={() => setShowMemberSlide(false)} />
                    </ThemedView>
                </Modal>
            </ParallaxScrollView>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowFormModal(true)}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
        </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
    page: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
        paddingBottom: 70, // For bottom nav
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        // gap: 10,
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        width: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(1, 119, 251, 0.1)',
    },
    categoryButtonText: {
        fontWeight: '500',
    },
    addButton: {
        margin: 10,
        backgroundColor: '#2A52BE',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        position: 'absolute',
        right: 15,
        bottom: 80,
        width: 40
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});
