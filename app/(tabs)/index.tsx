import { Dimensions, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedView } from '@/components/ThemedView';
import { Header } from '@react-navigation/elements';

export default function HomeScreen() {
  return (
    <>
    <Header title="Dashboard" />
    <ParallaxScrollView>
      <ThemedView style={styles.gamificationContainer}>

      </ThemedView>
    </ParallaxScrollView>
    </>
  );
}

const screenWidth = Dimensions.get('window').width;
const adjustedWidth = screenWidth - 30;

const styles = StyleSheet.create({
  gamificationContainer: {
    height: 120,
    width: adjustedWidth,
    borderRadius: 8,
    backgroundColor: "#2A52BE",
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
