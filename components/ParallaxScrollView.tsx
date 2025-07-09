import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  // headerImage: ReactElement;
  // headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  style,
  contentContainerStyle,
}: // headerImage,
// headerBackgroundColor,
Props) {
  const { theme } = useTheme();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <ThemedView
      style={[styles.container, style, { backgroundColor: theme.background }]}
    >
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          { paddingBottom: bottom, backgroundColor: theme.background },
        ]}
      >
        <ThemedView
          style={[styles.content, { backgroundColor: theme.background }]}
        >
          {children}
        </ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "none",
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    // padding: 32,
    alignItems: "center",
    gap: 10,
    overflow: "scroll",
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    // Removed flexGrow: 1 to avoid stretching content
  },
});

// import type { PropsWithChildren } from 'react';
// import { StyleSheet } from 'react-native';
// import Animated, {
//   interpolate,
//   useAnimatedRef,
//   useAnimatedStyle,
//   useScrollViewOffset,
// } from 'react-native-reanimated';

// import { ThemedView } from '@/components/ThemedView';
// import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
// import { useColorScheme } from '@/hooks/useColorScheme';

// const HEADER_HEIGHT = 250;

// type Props = PropsWithChildren<{
//   // headerImage: ReactElement;
//   headerBackgroundColor: { dark: string; light: string };
// }>;

// export default function ParallaxScrollView({
//   children,
//   // headerImage,
//   headerBackgroundColor,
// }: Props) {
//   const colorScheme = useColorScheme() ?? 'light';
//   const scrollRef = useAnimatedRef<Animated.ScrollView>();
//   const scrollOffset = useScrollViewOffset(scrollRef);
//   const bottom = useBottomTabOverflow();
//   const headerAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [
//         {
//           translateY: interpolate(
//             scrollOffset.value,
//             [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
//             [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
//           ),
//         },
//         {
//           scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
//         },
//       ],
//     };
//   });

//   return (
//     <ThemedView style={styles.container}>
//       <Animated.ScrollView
//         ref={scrollRef}
//         scrollEventThrottle={16}
//         scrollIndicatorInsets={{ bottom }}
//         contentContainerStyle={{ paddingBottom: bottom }}>
//         <Animated.View
//           style={[
//             styles.header,
//             { backgroundColor: headerBackgroundColor[colorScheme] },
//             headerAnimatedStyle,
//           ]}>
//           {/* {headerImage} */}
//         </Animated.View>
//         <ThemedView style={styles.content}>{children}</ThemedView>
//       </Animated.ScrollView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     height: HEADER_HEIGHT,
//     overflow: 'hidden',
//   },
//   content: {
//     flex: 1,
//     padding: 32,
//     gap: 16,
//     overflow: 'hidden',
//   },
// });
