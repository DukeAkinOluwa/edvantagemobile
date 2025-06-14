import { useGlobalStyles } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Animated, {
    interpolateColor,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface NavigationHeaderProps {
  title: string;
}

export const NavigationHeader = ({ title }: NavigationHeaderProps) => {
  const router = useRouter();
  const globalStyles = useGlobalStyles()

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(3, { duration: 9000 }), -1, true);
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const color1 = interpolateColor(
      progress.value % 3,
      [0, 1, 2, 3],
      ['#2B7FFF', '#2A52BE', '#FFD700', '#2B7FFF']
    );
    const color2 = interpolateColor(
      (progress.value + 1) % 3,
      [0, 1, 2, 3],
      ['#2A52BE', '#FFD700', '#2B7FFF', '#2A52BE']
    );

    return {
      colors: [color1, color2] as [string, string],
    };
  });

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.headerTitle, globalStyles.semiLargeText]}>{title}</Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity onPress={() => router.push('/notifications-page')}>
          <FontAwesome6 name="bell" size={25} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/gamificationPage')}>
          <MaskedView
          style={{height: 25, width: 25}}
          maskElement={
            <FontAwesome6 name="bolt" size={25} color='#2A52BE' />
          }
          >
            <AnimatedLinearGradient
              colors={['#2B7FFF', '#2A52BE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
              animatedProps={animatedProps}
            />
          </MaskedView>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile-page')}>
          <FontAwesome6 name="user-circle" size={25} color="#2A52BE" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // or your themed background
  },
  headerTitle: {
    fontSize: 21,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
    height: 30,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  gradient: {
    width: 60,
    height: 60,
  },
});