// In a new file like TestAnimation.js or directly in App.js for testing
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

function TestAnimation() {
  const animatedWidth = useSharedValue(50);

    useEffect(() => {
        animatedWidth.value = withRepeat(
            withTiming(200, { duration: 2000 }), // Animate to 200px over 2 seconds
            -1, // Infinite loop
            true // Reverse on each loop
        );
    }, []);

  const animatedStyles = useAnimatedProps(() => {
    return {
      width: animatedWidth.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, animatedStyles]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    height: 50,
    backgroundColor: 'blue',
  },
});

export default TestAnimation;

// In your App.js or wherever you render your main component:
// import TestAnimation from './TestAnimation';
// ...
// <TestAnimation />