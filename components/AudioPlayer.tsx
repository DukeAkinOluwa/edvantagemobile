import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { FontAwesome6 } from "@expo/vector-icons";

export function AudioPlayer({ 
  uri, 
  theme, 
  isMe 
}: { 
  uri: string; 
  theme: any; 
  isMe: boolean; 
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  
  const textColor = isMe ? "#fff" : theme.text;
  const timeColor = isMe ? "rgba(255,255,255,0.7)" : theme.placeholder;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSound = async () => {
    try {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      if (status.isLoaded) {
        setDuration(status.durationMillis ?? 0);
        await newSound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to load sound", err);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis ?? 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadSound();
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
        <FontAwesome6 name={isPlaying ? "pause" : "play"} size={16} color={isMe ? "#2A52BE" : "#fff"} />
      </TouchableOpacity>
      <View style={styles.waveformContainer}>
        {/* Simple Progress Bar */}
        <View style={[styles.track, { backgroundColor: isMe ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)" }]}>
          <View style={[styles.progress, { width: `${progress}%`, backgroundColor: isMe ? "#fff" : "#2A52BE" }]} />
        </View>
        <Text style={[styles.timeText, { color: timeColor }]}>
          {formatTime(position || duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 150,
    gap: 10,
    paddingVertical: 5,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flex: 1,
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
    marginBottom: 4,
  },
  progress: {
    height: "100%",
    borderRadius: 2,
  },
  timeText: {
    fontSize: 11,
  },
});
