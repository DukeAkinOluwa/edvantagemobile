import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

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
    StudyCardTemplate,
} from '@/global/templates';

export default function ChatScreen() {
    const router = useRouter();
    const globalStyles = useGlobalStyles();
    const { screenWidth } = useResponsiveDimensions();

    // --- Types ---
    interface PersonalOrGroupChat {
        id: string;
        name: string;
        message: string;
        type: 'Personal' | 'Group';
        time: string;
    }

    interface StudyGroup {
        id: string;
        title: string;
        description: string;
        type: 'Study';
    }

    interface ProjectItem {
        id: string;
        title: string;
        description: string;
        dueDate: string;
        priority: string;
        tasks: {
        title: string;
        description: string;
        dueDate: string;
        status: string;
        assignedTo: string;
        };
        type: 'Projects';
    }

    type FileTypeCategory = 'General' | 'Study' | 'Projects';

    // --- States ---
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FileTypeCategory>('General');

    // --- Sample Data ---
    const personalChats: PersonalOrGroupChat[] = [
        { id: '1', name: 'John Doe', message: 'Hey, how are you?', type: 'Personal', time: '9:45 AM' },
        { id: '2', name: 'Study Group', message: 'Don’t forget our 4PM meeting!', type: 'Group', time: '8:30 AM' },
        { id: '3', name: 'Jane Smith', message: 'I sent the slides.', type: 'Personal', time: 'Yesterday' },
        { id: '4', name: 'Project Team', message: 'Code repo has been updated.', type: 'Group', time: '2d ago' },
    ];

    const studyGroups: StudyGroup[] = [
        { id: '13434232', title: 'Group 1', description: 'Group for smart people', type: 'Study' },
    ];

    const projects: ProjectItem[] = [
        {
        id: '34324',
        title: 'Work Project',
        description: 'Project',
        dueDate: '25/03/2026',
        priority: 'high',
        tasks: {
            title: 'First Task',
            description: 'First Descrip',
            dueDate: '25/02/2026',
            status: 'completed',
            assignedTo: 'user648329',
        },
        type: 'Projects',
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
        }
    })

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

                <ThemedView style={styles.listContainer}>
                {selectedCategory === 'General' &&
                    (filteredList as PersonalOrGroupChat[]).map(chat => (
                    <ChatListCardTemplate
                        key={chat.id}
                        chat={chat}
                        onPress={() => router.push(`/chat/${chat.id}`)}
                    />
                ))}

                {selectedCategory === 'Study' &&
                    (filteredList as StudyGroup[]).map(study => (
                    <StudyCardTemplate
                        key={study.id}
                        studyGroup={study}
                        onPress={() => router.push(`/study/${study.id}`)}
                    />
                    ))}

                {selectedCategory === 'Projects' &&
                    (filteredList as ProjectItem[]).map(project => (
                    <ProjectCardTemplate
                        key={project.id}
                        project={project}
                        onPress={() => router.push(`/projects/${project.id}`)}
                    />
                    ))}
                </ThemedView>
            </ParallaxScrollView>
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
        gap: 10,
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
});
