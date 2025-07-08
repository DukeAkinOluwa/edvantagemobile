import { Colors } from '@/constants/Colors';
import { useThemeContext } from '@/context/ThemeContext'; // <-- Make sure to create this context

/**
 * Get a color based on the user's selected theme (light, dark, or system).
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { resolvedTheme } = useThemeContext(); // <-- Use resolved theme from context
  const colorFromProps = props[resolvedTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[resolvedTheme][colorName];
  }
}