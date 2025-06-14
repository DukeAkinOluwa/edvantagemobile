import profileImage from '@/assets/images/dummy/Titilayo.jpg';
import { useGlobalStyles } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NavigationHeaderProps {
  title: string;
}

export const NavigationHeader = ({ title }: NavigationHeaderProps) => {
  const router = useRouter();
  const globalStyles = useGlobalStyles()

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
            <LinearGradient
              colors={['#2A52BE', '#2B7FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </MaskedView>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile-page')}>
          <Image
            source={profileImage}
            style={styles.avatar}
          />
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});