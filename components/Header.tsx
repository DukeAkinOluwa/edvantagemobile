// components/Header.tsx
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HeaderProps = {
  title: string;
};

export const Header = ({ title }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={() => router.push('/notifications-page')}>
          <Image source={require('@/assets/icons/bell.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile-page')}>
          <Image source={require('@/assets/images/profile.png')} style={styles.profile} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
