// components/SearchBar.tsx
import { ThemedView } from '@/components/ThemedView';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export const SearchBar: React.FC<Props> = ({ value, onChangeText }) => {

    const { screenWidth } = useResponsiveDimensions()
    const globalStyles = useGlobalStyles()
    
    const boundaryWidth = screenWidth - 10;

    return (
        <ThemedView style={[styles.searchContainer, { width: boundaryWidth }]}>
        <TextInput
            placeholder="Search by title, author, or summary"
            value={value}
            onChangeText={onChangeText}
            style={[styles.searchInput, globalStyles.smallText]}
            placeholderTextColor="#999"
        />
        </ThemedView>
    );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 0,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(204, 204, 204, .2)',
    color: '#000',
  },
});