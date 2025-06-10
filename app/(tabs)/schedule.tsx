import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Header } from '@react-navigation/elements';

export default function ScheduleScreen() {
  return (
    <>
    <Header title="Schedule" />
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Your Schedule</ThemedText>
        <ThemedText>
          View upcoming events, tasks, and academic deadlines. Stay on top of your day.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  headerImage: {
    height: 150,
    width: 300,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});