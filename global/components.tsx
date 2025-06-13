// components/SearchBar.tsx
import { ThemedView } from '@/components/ThemedView';
import { screenWidth } from '@/global/functions';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

const boundaryWidth = screenWidth - 10;

export const SearchBar: React.FC<Props> = ({ value, onChangeText }) => {
  return (
    <ThemedView style={[styles.searchContainer, { width: boundaryWidth }]}>
      <TextInput
        placeholder="Search by title, author, or summary"
        value={value}
        onChangeText={onChangeText}
        style={styles.searchInput}
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
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
});