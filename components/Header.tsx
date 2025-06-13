import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NavigationHeaderProps {
  title: string;
}

export const NavigationHeader = ({ title }: NavigationHeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity onPress={() => router.push('/notifications-page')}>
          <FontAwesome6 name="bell" size={25} />
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff', // or your themed background
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 21,
    fontFamily: 'Montserrat-Medium', // Use globalStyles.mediumText if needed
    color: '#111',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
  },
});