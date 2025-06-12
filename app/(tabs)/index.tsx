import { Dimensions, StyleSheet } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGlobalStyles } from '@/styles/globalStyles';

export default function HomeScreen() {

  const globalStyles = useGlobalStyles()

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

  return (
    <ThemedView style={styles.page}>
      <NavigationHeader title="Dashboard" />
      <ParallaxScrollView>
        <ThemedView style={styles.gamificationContainer} lightColor='#2A52BE' darkColor='#FAFBFD'>

        </ThemedView>
        <ThemedView style={styles.todaysTasks}>
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
              <EventCard key={data.title} event={data} />
            ))}
          </ThemedView>
        </ThemedView>

      </ParallaxScrollView>
    </ThemedView>
  );

  function EventCard(event: any) {
    const cardData = event.event
    return (
      <ThemedView style={styles.eventCard}>
        <ThemedView style={styles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Event
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.title}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Time
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.startTime} - {cardData.endTime}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Location
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.location}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    )
  }
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const adjustedWidth = screenWidth - 30;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    height: screenHeight,
    gap: 10,
  },
  gamificationContainer: {
    height: 120,
    width: adjustedWidth,
    borderRadius: 8,
    // backgroundColor: "#2A52BE",
  },
  todaysTasks: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 20,
    width: adjustedWidth,
    
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
  eventCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: .5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
    borderStyle: 'solid',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
  },
  eventCardSection: {
    flexDirection: 'column',
  },
});