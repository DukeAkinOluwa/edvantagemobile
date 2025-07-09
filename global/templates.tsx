import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { StyleSheet } from "react-native";

import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { useTheme } from "@/components/Header";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";

import { useRouter } from "expo-router";

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

type ProfilePageNavItem = {
  name: string;
  link: string;
};

const resourceCategoryIconMap: Record<string, string> = {
  video: "video-camera",
  image: "image",
  document: "file-text",
  audio: "music",
  other: "file",
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

const resourceExtensionCategories: { [key: string]: string[] } = {
  Video: ["mp4", "m4a", "avi", "mov", "wmv", "flv", "mkv", "webm"],
  Image: ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp"],
  Document: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "odt"],
  Audio: ["mp3", "wav", "aac", "flac", "ogg"],
};

const resourceGetCategoryFromExtension = (ext: string): string => {
  const cleanedExt = ext.toLowerCase().replace(".", "");
  for (const category in resourceExtensionCategories) {
    if (resourceExtensionCategories[category].includes(cleanedExt)) {
      return category;
    }
  }
  return "Other";
};

export const ResourceListCard: React.FC<resourceCardProps> = ({ file }) => {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();

  const extension = file.filepath.split(".").pop() || "";
  const category = resourceGetCategoryFromExtension(extension);
  const lowerCaseCategory = category.toLowerCase();

  const iconName = resourceCategoryIconMap[lowerCaseCategory] || "file";
  const iconColor =
    theme.accent || resourceCategoryIconColor[lowerCaseCategory];
  const iconBackgroundColor =
    theme.backgroundSecondary ||
    resourceCategoryIconBackgroundColor[lowerCaseCategory];

  const { screenWidth } = useResponsiveDimensions();
  const boundaryWidth = screenWidth - 20;

  const dynamicStyles = StyleSheet.create({
    fileCard: {
      maxWidth: boundaryWidth - 20,
    },
  });

  return (
    <ThemedView
      style={[
        resourceCardStyles.fileCard,
        dynamicStyles.fileCard,
        { backgroundColor: theme.background },
      ]}
    >
      <ThemedView
        style={[
          resourceCardStyles.fileCardHeading,
          { backgroundColor: theme.background },
        ]}
      >
        <ThemedView
          style={[
            resourceCardStyles.fileCardHeadingIcon,
            { backgroundColor: iconBackgroundColor },
          ]}
        >
          <FontAwesome6 name={iconName} size={22} color={iconColor} />
        </ThemedView>
        <ThemedView
          style={[
            resourceCardStyles.fileCardHeadingTexts,
            { backgroundColor: theme.background },
          ]}
        >
          <ThemedText
            style={[
              globalStyles.mediumText,
              { fontWeight: "500", color: theme.text },
            ]}
          >
            {file.filename}
          </ThemedText>
          <ThemedText style={[globalStyles.smallText, { color: theme.text }]}>
            Uploaded by {file.uploadedBy}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={{ backgroundColor: theme.background }}>
        <ThemedText style={[globalStyles.baseText, { color: theme.text }]}>
          {file.summary}
        </ThemedText>
      </ThemedView>
      <ThemedView
        style={{
          gap: 15,
          alignItems: "center",
          flexDirection: "row",
          backgroundColor: theme.background,
        }}
      >
        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: theme.background,
          }}
        >
          <FontAwesome name="heart" size={17} color={theme.accent || "red"} />
          <ThemedText style={[globalStyles.baseText, { color: theme.text }]}>
            {file.likes}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: theme.background,
          }}
        >
          <FontAwesome6
            name="download"
            size={17}
            color={theme.primary || "#2A52BE"}
          />
          <ThemedText style={[globalStyles.baseText, { color: theme.text }]}>
            {file.downloads}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export function ChatListCardTemplate({
  chat,
  onPress,
}: {
  chat: ChatListCardProps;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();

  const boundaryWidth = screenWidth - 20; // Adjusted for padding/margin

  const chatStyles = StyleSheet.create({
    chatCard: {
      width: boundaryWidth - 20,
    },
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView
        style={[
          chatListCardTemplateStyles.chatCard,
          chatStyles.chatCard,
          { backgroundColor: theme.background },
        ]}
      >
        <ThemedView
          style={[
            chatListCardTemplateStyles.chatDetails,
            { backgroundColor: theme.background },
          ]}
        >
          <ThemedText
            style={[globalStyles.semiMediumText, { color: theme.text }]}
          >
            {chat.name}
          </ThemedText>
          <ThemedText style={[globalStyles.baseText, { color: theme.text }]}>
            {chat.message}
          </ThemedText>
        </ThemedView>
        <ThemedText
          style={[
            globalStyles.smallText,
            chatListCardTemplateStyles.chatTime,
            { color: theme.text },
          ]}
        >
          {chat.time}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

export function EventCardTemplate(event: any) {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();

  const cardData = event.event;

  return (
    <ThemedView
      style={[
        eventCardStyles.eventCard,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <ThemedView
        style={[
          eventCardStyles.eventCardSection,
          { backgroundColor: theme.background },
        ]}
      >
        <ThemedText style={[globalStyles.smallText, { color: theme.text }]}>
          Event
        </ThemedText>
        <ThemedText
          style={[globalStyles.semiMediumText, { color: theme.text }]}
        >
          {cardData.title}
        </ThemedText>
      </ThemedView>
      <ThemedView
        style={[
          eventCardStyles.eventCardSection,
          { backgroundColor: theme.background },
        ]}
      >
        <ThemedText style={[globalStyles.smallText, { color: theme.text }]}>
          Time
        </ThemedText>
        <ThemedText
          style={[globalStyles.semiMediumText, { color: theme.text }]}
        >
          {cardData.startTime} - {cardData.endTime}
        </ThemedText>
      </ThemedView>
      <ThemedView
        style={[
          eventCardStyles.eventCardSection,
          { backgroundColor: theme.background },
        ]}
      >
        <ThemedText style={[globalStyles.smallText, { color: theme.text }]}>
          Location
        </ThemedText>
        <ThemedText
          style={[globalStyles.semiMediumText, { color: theme.text }]}
        >
          {cardData.location}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function ProfilePageNavListTemplate({
  list,
}: {
  list: ProfilePageNavItem;
}) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(list.link as any)}
      style={[
        profilePageNavListTemplateStyles.option,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <ThemedText style={{ color: theme.text }}>{list.name}</ThemedText>
    </TouchableOpacity>
  );
}

const eventCardStyles = StyleSheet.create({
  eventCard: {
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderStyle: "solid",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
  },
  eventCardSection: {
    flexDirection: "column",
  },
});

const chatListCardTemplateStyles = StyleSheet.create({
  chatCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  chatDetails: {
    flexDirection: "column",
    gap: 4,
  },
  chatTime: {
    color: "#777",
  },
});

const resourceCardStyles = StyleSheet.create({
  fileCard: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
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

const profilePageNavListTemplateStyles = StyleSheet.create({
  option: {
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
});
