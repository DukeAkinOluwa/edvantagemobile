import { StyleSheet } from 'react-native';

import { NavigationHeader } from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EventCardTemplate } from '@/global/templates';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Switch, TextInput } from 'react-native';

export default function HomeScreen() {

  const globalStyles = useGlobalStyles()
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter()
  
  const adjustedWidth = screenWidth - 30;

  const [scheduleData, setScheduleData] = useState([
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
    },
  ])

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGroupEvent, setIsGroupEvent] = useState(false);
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const handleSave = () => {

    if (!title || !description || !startTime || !endTime) {
      alert("All fields are required.");
      return;
    }
    if (isGroupEvent && !location) {
      alert("Group ID is required for group events.");
      return;
    }
    if (startTime >= endTime) {
      alert("End time must be after start time.");
      return;
    }

    const newEvent = {
      title,
      startTime, //: startTime.toLocaleTimeString(),
      endTime, //: endTime.toLocaleTimeString(),
      location: location,
    };

    setScheduleData(prev => [...prev, newEvent]);
    setModalVisible(false);

    // Clear form
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setIsGroupEvent(false);
  };

  const dynamicStyles = StyleSheet.create({
    page: {
      flex: 1,
      paddingBottom: 70,
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
            <Pressable onPress={() => setModalVisible(true)}>
              <ThemedText style={[globalStyles.mediumText, globalStyles.actionText]}>
                New Event
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.todaysTasksContent}>
            {scheduleData.slice(0, 4).map(data => (
              <EventCardTemplate key={data.title} event={data} />
            ))}
            <Pressable style={globalStyles.button1} onPress={() => router.push('/schedule')}>
              <ThemedText style={[globalStyles.mediumText, globalStyles.actionText2]}>
                See All
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

      </ParallaxScrollView>
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchableArea} onPress={() => setModalVisible(false)} />
          <ThemedView style={styles.modalContent}>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
            <ThemedView style={styles.switchRow}>
              <ThemedText>Is Group Event</ThemedText> 
              <Switch value={isGroupEvent} onValueChange={setIsGroupEvent} />
            </ThemedView>
            <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
            <TextInput placeholder="Start Time" value={startTime} onChangeText={setStartTime} style={styles.input} />
            <TextInput placeholder="End Time (e.g. 2025-06-14)" value={endTime} onChangeText={setEndTime} style={styles.input} />
            <Pressable style={styles.customButton} onPress={() => handleSave()}>
              <ThemedText style={[globalStyles.semiLargeText, styles.customButtonText]}>Save</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    fontFamily: 'Montserrat-Regular',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customButton: {
    backgroundColor: '#2A52BE', // primary color
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  customButtonText: {
    color: '#fff',
  },
  backdropTouchableArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});