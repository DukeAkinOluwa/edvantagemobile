import profileImage from '@/assets/images/dummy/Titilayo.jpg';
import { NavigationHeader } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from "@/components/ThemedView";
import { ProfilePageNavListTemplate } from '@/global/templates';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useGlobalStyles } from '@/styles/globalStyles';
import { Image, StyleSheet } from "react-native";

export default function ProfilePage() {

    const globalStyles = useGlobalStyles()
    const { screenHeight, screenWidth } = useResponsiveDimensions()
    const dynamicStyles = StyleSheet.create({
        summaryCard: {
            width: screenWidth - 20,
        },
        profilePageNavigationContainer: {
            width: screenWidth - 20 - 20 // Adjusted for Padding
        }
    })

    const profileNavigationList = [
        {
            id: 1,
            name: 'Settings',
            link: '/settingsPage'
        },
        {
            id: 2,
            name: 'FAQs',
            link: '/faqsPage'
        },
        {
            id: 3,
            name: 'Terms and Conditions',
            link: '/termsAndConditions'
        }
    ]

    return (
        <>
        <ThemedView style={{ flex: 1, padding: 10 }}>
            <NavigationHeader title="Profile" />
            <ParallaxScrollView>
                <ThemedView style={[styles.summaryCard, dynamicStyles.summaryCard]}>
                    <Image source={profileImage} style={styles.avatar} />
                    <ThemedText style={globalStyles.semiLargeText}>
                        AkinOluwa
                    </ThemedText>
                    <ThemedText style={globalStyles.mediumText}>
                        Bells University Of Technology
                    </ThemedText>
                    <ThemedText style={globalStyles.smallText}>
                        Mechatronics Engineering | 300L
                    </ThemedText>
                </ThemedView>
                <ThemedView style={[styles.profilePageNavigationContainer, dynamicStyles.profilePageNavigationContainer]}>
                    {
                        profileNavigationList.map(list => (
                            <ProfilePageNavListTemplate key={list.id} list={list} />
                        ))
                    }
                </ThemedView>
            </ParallaxScrollView>
        </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    summaryCard: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    profilePageNavigationContainer: {
        flexDirection: 'column',
        gap: 5,
        borderWidth: .5,
        borderRadius: 10,
        borderColor: 'rgba(17, 17, 17, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
    }
})