import { StyleSheet } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EventCardTemplate } from '@/global/templates';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';

export default function HomeScreen() {

  const globalStyles = useGlobalStyles()
  const { screenWidth, screenHeight } = useResponsiveDimensions();
  
  const adjustedWidth = screenWidth - 30;

  const scheduleData = [
    {
      title: "Event 1",
      startTime: "9:00 AM",
      endTime: "11:00 AM",
      location: "ELT"
    },
    {
      title: "Event 2",
      startTime: "1:00 PM",
      endTime: "3:00 PM",
      location: "LT2"
    },
    {
      title: "Event 3",
      startTime: "4:00 PM",
      endTime: "6:00 PM",
      location: "LT1"
    },
    {
      title: "Event 4",
      startTime: "7:00 PM",
      endTime: "9:00 PM",
      location: "LT3"
    }
  ]

  const dynamicStyles = StyleSheet.create({
    page: {
      height: screenHeight - 15,
    },
    gamificationContainer: {
      width: adjustedWidth,
    },
    todaysTasks: {
      width: adjustedWidth,
    },
  })

  return (
    <ThemedView style={[styles.page, dynamicStyles.page]}>
      <NavigationHeader title="Dashboard" />
      <ParallaxScrollView>
        <ThemedView style={[styles.gamificationContainer, dynamicStyles.gamificationContainer]} lightColor='#2A52BE' darkColor='#FAFBFD'>

        </ThemedView>
        <ThemedView style={[styles.todaysTasks, dynamicStyles.todaysTasks]}>
          <ThemedView style={styles.cardHeading}>
            <ThemedText style={ globalStyles.semiLargeText }>
              Today&apos;s Schedule
            </ThemedText>
            <ThemedText style={[globalStyles.mediumText, globalStyles.actionText]}>
              New Event
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.todaysTasksContent}>
            {scheduleData.map(data => (
              <EventCardTemplate key={data.title} event={data} />
            ))}
          </ThemedView>
        </ThemedView>

      </ParallaxScrollView>
    </ThemedView>
  );

  
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    gap: 10,
  },
  gamificationContainer: {
    height: 120,
    borderRadius: 8,
    // backgroundColor: "#2A52BE",
  },
  todaysTasks: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 20,
    
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,

    // Android shadow
    elevation: 4,
  },
  cardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todaysTasksContent: {
    flexDirection: 'column',
    gap: 10
  },
});