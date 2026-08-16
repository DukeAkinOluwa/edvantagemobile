// lib/alarmAudioService.ts
// Handles continuous background audio looping and haptics for alarms

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

let soundObject: Audio.Sound | null = null;
let isPlaying = false;
let vibrationInterval: any = null;

/**
 * Initializes the audio system to play in the background and ignore the silent switch.
 */
export async function initializeAudio() {
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (err) {
    console.error("Failed to initialize audio mode:", err);
  }
}

/**
 * Starts playing the continuous alarm sound and vibration pattern.
 */
export async function startAlarmAudio() {
  if (isPlaying) return;
  isPlaying = true;

  try {
    // Continuous vibration pattern (Android only natively, polyfilled via interval for iOS)
    Vibration.vibrate([1000, 1000, 1000, 1000], true);

    // iOS haptic fallback loop
    vibrationInterval = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 2000);

    soundObject = new Audio.Sound();
    // Use a default alarm sound from assets or system
    // Note: You must require a local audio file here, e.g. require('../assets/alarm.mp3')
    // For this implementation, we assume a local asset exists or fallback to a remote one for testing
    const source = require("@/assets/audio/alarm-default.wav"); 
    
    await soundObject.loadAsync(source, {
      shouldPlay: true,
      isLooping: true,
      volume: 1.0,
    });
  } catch (err) {
    console.error("Failed to start alarm audio:", err);
    // If local asset fails, try haptics only as fallback
  }
}

/**
 * Stops the alarm audio and vibrations.
 */
export async function stopAlarmAudio() {
  isPlaying = false;
  
  Vibration.cancel();
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
    } catch (err) {
      console.error("Failed to stop audio:", err);
    } finally {
      soundObject = null;
    }
  }
}
