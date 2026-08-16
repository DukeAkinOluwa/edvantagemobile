import { lightTheme, darkTheme } from '@/assets/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const Colors = {
  light: lightTheme,
  dark: darkTheme,
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
