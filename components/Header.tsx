// components/Header.tsx
import { useGlobalStyles } from '@/styles/globalStyles';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HeaderProps = {
  title: string;
};

export const Header = ({ title }: HeaderProps) => {
  const router = useRouter();
  const globalStyles = useGlobalStyles()

  return (
    <View style={styles.container}>
      <Text style={[ globalStyles.mediumText, styles.title ]}>{title}</Text>
      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={() => router.push('/notifications-page')}>
          <FontAwesome name='bell' size={25} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile-page')}>
          <FontAwesome name='user-circle' size={25} color="#2A52BE" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: 16,
    // paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 23,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  profile: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
