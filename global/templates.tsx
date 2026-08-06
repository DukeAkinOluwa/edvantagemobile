import { useTheme } from "@/components/Header";
import { useRouter } from "expo-router";

import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { Image } from "react-native";

import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  FileAudioIcon,
  FileDocIcon,
  FileIcon,
  FileImageIcon,
  FilePdfIcon,
  FileTextIcon,
  FileVideoIcon,
  HeartIcon,
  HourglassIcon
} from "phosphor-react-native";


// ===== Types =====
type ChatListCardProps = {
  id: string;
  name: string;
  message: string;
  time: string;
  imageLink: string;
  type: 'Personal' | 'Group';
};

type ResourceCardProps = {
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

type ProfilePageNavItem = {
  name: string;
  link: string;
};

interface StudyCardProps {
  studyGroup: {
    id: string;
    title: string;
    description: string;
    type: 'Study';
    imageLink: string;
    members: string[];
  };
  onPress?: () => void;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  tasks: {
    title: string;
    description: string;
    dueDate: string;
    status: string;
    assignedTo: string;
  }[];
  type: 'Projects';
  imageLink: string;
  members: string[];
}

// ===== Utility Maps & Functions =====
const resourceCategoryIconMap: Record<string, React.ComponentType<any>> = {
  pdf: FilePdfIcon,
  document: FileDocIcon,
  txt: FileTextIcon,
  image: FileImageIcon,
  video: FileVideoIcon,
  audio: FileAudioIcon, // Placeholder, can be replaced with a specific audio icon
  // Add more categories as needed
};

const resourceCategoryIconColor: Record<string, string> = {
  video: "#2A52BE",
  image: "#00C853",
  document: "#9C27B0",
  audio: "#F44336",
  other: "#FFC107",
};

const resourceCategoryIconBackgroundColor: Record<string, string> = {
  video: "rgba(1, 119, 251, 0.1)",
  image: "rgba(0, 200, 83, 0.1)",
  document: "rgba(156, 39, 176, 0.1)",
  audio: "rgba(244, 67, 54, 0.1)",
  other: "rgba(255, 193, 7, 0.1)",
};

const resourceExtensionCategories: Record<string, string[]> = {
  Video: ['mp4', 'm4a', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
  Image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'],
  Document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'odt'],
  Audio: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
};

const getResourceCategoryFromExtension = (ext: string): string => {
  const cleaned = ext.toLowerCase().replace('.', '');
  for (const category in resourceExtensionCategories) {
    if (resourceExtensionCategories[category].includes(cleaned)) {
      return category;
    }
  }
  return "Other";
};

// ===== Components =====
export const ResourceListCard: React.FC<ResourceCardProps> = ({ file }) => {
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();

  const extension = file.filepath.split(".").pop() || "";
  const category = getResourceCategoryFromExtension(extension).toLowerCase();

  const IconComponent = resourceCategoryIconMap[category] || FileTextIcon;

  return (
    <ThemedView
      style={[
        resourceCardStyles.fileCard,
        { width: screenWidth - 30 },
      ]}
    >
      {/* Header */}
      <ThemedView style={resourceCardStyles.fileCardHeading}>
        <ThemedView
          style={[
            resourceCardStyles.fileCardHeadingIcon,
            {
              backgroundColor:
                resourceCategoryIconBackgroundColor[category],
            },
          ]}
        >
          <IconComponent
            size={22}
            color={resourceCategoryIconColor[category]}
            weight="fill"
          />
        </ThemedView>

        <ThemedView style={resourceCardStyles.fileCardHeadingTexts}>
          <ThemedText
            style={[globalStyles.mediumText, { fontWeight: "500" }]}
          >
            {file.filename}
          </ThemedText>
          <ThemedText style={globalStyles.smallText}>
            Uploaded by {file.uploadedBy}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Summary */}
      <ThemedText style={globalStyles.baseText}>
        {file.summary}
      </ThemedText>

      {/* Actions */}
      <ThemedView
        style={{
          gap: 15,
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <HeartIcon  size={17} color="red" weight="fill" />
          <ThemedText style={globalStyles.baseText}>
            {file.likes}
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <DownloadSimpleIcon size={17} color="#2A52BE" weight="bold" />
          <ThemedText style={globalStyles.baseText}>
            {file.downloads}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export function ChatListCardTemplate({ chat, onPress }: { chat: ChatListCardProps; onPress: () => void }) {
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={[chatListCardTemplateStyles.chatCard, { width: screenWidth - 40 }]}>
        <Image source={{uri: chat.imageLink}} style={chatListCardTemplateStyles.userImage}/>
        <ThemedView style={chatListCardTemplateStyles.chatDetails}>
          <ThemedText style={globalStyles.semiMediumText}>{chat.name}</ThemedText>
          <ThemedText style={globalStyles.baseText}>{chat.message}</ThemedText>
        </ThemedView>
        <ThemedText style={[ globalStyles.smallText, chatListCardTemplateStyles.chatTime, { color: theme.text }, ]} >
          {chat.time}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

export function StudyCardTemplate({ studyGroup, onPress }: StudyCardProps) {
  
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles()

  const responsiveStyles = StyleSheet.create({
    cardImage: {
      width: screenWidth - 40,
    }
  })

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={studyCardStyles.card}>
        <Image source={{uri: studyGroup.imageLink}} style={[studyCardStyles.cardImage, responsiveStyles.cardImage]}/>
        <ThemedView style={studyCardStyles.cardBody}>
          <ThemedText style={[globalStyles.semiLargeText]}>{studyGroup.title}</ThemedText>
          <ThemedText style={[globalStyles.semiMediumLightText]}>{studyGroup.description}</ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>{studyGroup.members.length} members</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

export function ProjectCardTemplate({ project, onPress }: { project: ProjectItem; onPress: () => void }) {
  
  const { screenWidth } = useResponsiveDimensions();
  const globalStyles = useGlobalStyles()
  const { theme } = useTheme();

  const responsiveStyles = StyleSheet.create({
    cardImage: {
      width: screenWidth - 40,
    }
  })

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={projectCardStyles.card}>
        <Image source={{uri: project.imageLink}} style={[studyCardStyles.cardImage, responsiveStyles.cardImage]}/>
        <ThemedView style={projectCardStyles.cardBody}>
          <ThemedText style={[globalStyles.semiLargeText]}>{project.title}</ThemedText>
          <ThemedText style={[globalStyles.semiMediumLightText]}>{project.description}</ThemedText>
          <ThemedView style={projectCardStyles.relevantSummary}>
            <ThemedView style={projectCardStyles.relevantSummaryMember}>
              <CalendarBlankIcon size={18} color={theme.text} />
              <ThemedText style={globalStyles.semiMediumText}>{project.dueDate}</ThemedText>
            </ThemedView>
            <ThemedView style={projectCardStyles.relevantSummaryMember}>
              <FileIcon size={18} color={theme.text} />
              <ThemedText style={globalStyles.semiMediumText}>{project.tasks.length} tasks</ThemedText>
            </ThemedView>
            <ThemedView style={projectCardStyles.relevantSummaryMember}>
              <HourglassIcon size={18} color={project.priority === 'high' ? '#E63946' : '#2A9D8F'} />
              <ThemedText style={[globalStyles.semiMediumText, { color: project.priority === 'high' ? '#E63946' : '#2A9D8F' }]}>
                {project.priority.toUpperCase()}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          {/* <ThemedText style={projectCardStyles.taskStatus}>Status: {project.tasks.status}</ThemedText> */}
          <ThemedText style={globalStyles.semiMediumText}>{project.members.length} members</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

export function EventCardTemplate({ event }: any) {
  const globalStyles = useGlobalStyles();
  const cardData = event.event;

  return (
    <ThemedView style={eventCardStyles.eventCard}>
      {['Event', 'Time', 'Location'].map((label, i) => (
        <ThemedView style={eventCardStyles.eventCardSection} key={i}>
          <ThemedText style={globalStyles.smallText}>{label}</ThemedText>
          <ThemedText style={globalStyles.semiMediumText}>
            {label === 'Event' && cardData.title}
            {label === 'Time' && `${cardData.startTime} - ${cardData.endTime}`}
            {label === 'Location' && cardData.location}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

export function ProfilePageNavListTemplate({ list }: { list: ProfilePageNavItem }) {
  const router = useRouter();
  const globalStyles = useGlobalStyles()
  return (
    <TouchableOpacity onPress={() => router.push(list.link as any)} style={profilePageNavListTemplateStyles.option}>
      <ThemedText style={globalStyles.baseText} >{list.name}</ThemedText>
    </TouchableOpacity>
  );
}

// ===== Styles =====
const resourceCardStyles = StyleSheet.create({
  fileCard: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 15,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  fileCardHeading: {
    gap: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  fileCardHeadingIcon: {
    width: 37,
    height: 37,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  fileCardHeadingTexts: {
    flexDirection: "column",
  },
});

const chatListCardTemplateStyles = StyleSheet.create({
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    gap: 10,
  },
  userImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  chatDetails: {
    flexDirection: 'column',
  },
  chatTime: {
    color: '#777',
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

const studyCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardImage: {
    height: 70,
  },
  cardBody: {
    padding: 15,
  },
});

const projectCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff4e6',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 21 },
    elevation: 2,
  },
  cardBody: {
    padding: 15,
    gap: 5,
  },
  relevantSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  relevantSummaryMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskStatus: {
    fontSize: 13,
    color: '#666',
  },
});

const eventCardStyles = StyleSheet.create({
  eventCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
  },
  eventCardSection: {
    flexDirection: 'column',
  },
});

const profilePageNavListTemplateStyles = StyleSheet.create({
  option: {
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(17, 17, 17, 0.2)',
  },
});
