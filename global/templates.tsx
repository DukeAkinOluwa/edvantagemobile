import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { StyleSheet } from "react-native";

import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";

import { screenWidth } from "./functions";

const boundaryWidth = screenWidth - 20

type ChatListCardProps = {
  id: string;
  name: string;
  message: string;
  time: string;
};

type resourceCardProps = {
  file: {
    filepath: string;
    filename: string;
    uploadedBy: string;
    summary: string;
    likes: number;
    downloads: number;
    source: string;
    sourceId: number;
    uploadedAt: string;
  };
};

const resourceCategoryIconMap: Record<string, string> = {
  video: 'video-camera',
  image: 'image',
  document: 'file-text',
  audio: 'music',
  other: 'file',
};

const resourceCategoryIconColor: Record<string, string> = {
  video: '#2A52BE',
  image: '#00C853',
  document: '#9C27B0',
  audio: '#F44336',
  other: '#FFC107',
};

const resourceCategoryIconBackgroundColor: Record<string, string> = {
  video: 'rgba(1, 119, 251, 0.1)',
  image: 'rgba(0, 200, 83, 0.1)',
  document: 'rgba(156, 39, 176, 0.1)',
  audio: 'rgba(244, 67, 54, 0.1)',
  other: 'rgba(255, 193, 7, 0.1)',
};

const resourceExtensionCategories: { [key: string]: string[] } = {
  Video: ['mp4', 'm4a', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
  Image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'],
  Document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'odt'],
  Audio: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
};

const resourceGetCategoryFromExtension = (ext: string): string => {
  const cleanedExt = ext.toLowerCase().replace('.', '');
  for (const category in resourceExtensionCategories) {
    if (resourceExtensionCategories[category].includes(cleanedExt)) {
      return category;
    }
  }
  return 'Other';
};

export const ResourceListCard: React.FC<resourceCardProps> = ({ file }) => {
  const globalStyles = useGlobalStyles();

  const extension = file.filepath.split('.').pop() || '';
  const category = resourceGetCategoryFromExtension(extension);
  const lowerCaseCategory = category.toLowerCase();

  const iconName = resourceCategoryIconMap[lowerCaseCategory] || 'file-o';
  const iconColor = resourceCategoryIconColor[lowerCaseCategory];
  const iconBackgroundColor = resourceCategoryIconBackgroundColor[lowerCaseCategory];

  return (
    <ThemedView style={resourceCardStyles.fileCard}>
      <ThemedView style={resourceCardStyles.fileCardHeading}>
        <ThemedView
          style={[resourceCardStyles.fileCardHeadingIcon, { backgroundColor: iconBackgroundColor }]}
        >
          <FontAwesome name={iconName} size={22} color={iconColor} />
        </ThemedView>
        <ThemedView style={resourceCardStyles.fileCardHeadingTexts}>
          <ThemedText style={[globalStyles.mediumText, { fontWeight: '500' }]}>
            {file.filename}
          </ThemedText>
          <ThemedText style={globalStyles.smallText}>
            Uploaded by {file.uploadedBy}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView>
        <ThemedText style={globalStyles.baseText}>{file.summary}</ThemedText>
      </ThemedView>
      <ThemedText style={globalStyles.baseText}>
        Likes: {file.likes} | Downloads: {file.downloads}
      </ThemedText>
    </ThemedView>
  );
};

export function ChatListCardTemplate({ chat }: { chat: ChatListCardProps }) {
  const globalStyles = useGlobalStyles();
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('chatroomscreen', { chatId: chat.id, chatName: chat.name })}
    >
      <ThemedView style={chatListCardTemplateStyles.chatCard}>
        <ThemedView style={chatListCardTemplateStyles.chatDetails}>
          <ThemedText style={globalStyles.semiMediumText}>
            {chat.name}
          </ThemedText>
          <ThemedText style={globalStyles.smallText}>
            {chat.message}
          </ThemedText>
        </ThemedView>
        <ThemedText style={[globalStyles.smallText, chatListCardTemplateStyles.chatTime]}>
          {chat.time}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

export function EventCardTemplate(event: any) {

    const globalStyles = useGlobalStyles()
    const cardData = event.event

    return (
      <ThemedView style={eventCardStyles.eventCard}>
        <ThemedView style={eventCardStyles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Event
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.title}
          </ThemedText>
        </ThemedView>
        <ThemedView style={eventCardStyles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Time
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.startTime} - {cardData.endTime}
          </ThemedText>
        </ThemedView>
        <ThemedView style={eventCardStyles.eventCardSection}>
          <ThemedText style={globalStyles.smallText}>
            Location
          </ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {cardData.location}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    )
}



const eventCardStyles = StyleSheet.create({
  eventCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: .5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
    borderStyle: 'solid',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
  },
  eventCardSection: {
    flexDirection: 'column',
  },
})

const chatListCardTemplateStyles = StyleSheet.create({
  chatCard: {
    width: boundaryWidth - 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  chatDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  chatTime: {
    color: '#777',
  },
});

const resourceCardStyles = StyleSheet.create({
  fileCard: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
    gap: 10,
    maxWidth: boundaryWidth - 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  fileCardHeading: {
    gap: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCardHeadingIcon: {
    width: 37,
    height: 37,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCardHeadingTexts: {
    flexDirection: 'column',
  },
});