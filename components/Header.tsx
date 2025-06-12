// components/NavigationHeader.tsx
import { FontAwesome } from '@expo/vector-icons';
import { Header } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export const NavigationHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <Header
      title={title}
      headerTitleAlign="left"
      headerRight={() => (
        <View style={{ flexDirection: 'row', gap: 20, marginRight: 16 }}>
          <TouchableOpacity onPress={() => router.push('/notifications-page')}>
            <FontAwesome name="bell" size={25} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile-page')}>
            <FontAwesome name="user-circle" size={25} color="#2A52BE" />
          </TouchableOpacity>
        </View>
      )}
      headerStyle={{
        elevation: 4,
        height: 80,
      }}
      headerTitleStyle={{
        fontSize: 21,
        fontFamily: 'Montserrat-Medium', // Replace with your globalStyles.mediumText if it's custom
      }}
    />
  );
};