import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Message {
  id: string;
  userName: string;
  listingTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

const mockMessages: Message[] = [
  {
    id: "1",
    userName: "Mike's Workshop",
    listingTitle: "Professional Drill Press",
    lastMessage: "Sure, the drill press is available this weekend. What time works for you?",
    timestamp: "2h ago",
    unread: true,
  },
  {
    id: "2",
    userName: "Sarah's Tools",
    listingTitle: "Compact Excavator",
    lastMessage: "Thanks for booking! I'll send you the pickup location details.",
    timestamp: "1d ago",
    unread: false,
  },
  {
    id: "3",
    userName: "Tom's Garage",
    listingTitle: "Full Workshop Space",
    lastMessage: "The workshop has all the safety equipment you'll need.",
    timestamp: "3d ago",
    unread: false,
  },
];

interface MessageItemProps {
  message: Message;
  onPress: () => void;
}

function MessageItem({ message, onPress }: MessageItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.messageItem,
        { backgroundColor: message.unread ? theme.backgroundDefault : "transparent" },
        animatedStyle,
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="user" size={24} color={theme.textSecondary} />
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <ThemedText type="body" style={{ fontWeight: message.unread ? "700" : "600" }} numberOfLines={1}>
            {message.userName}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {message.timestamp}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: Colors.light.primary }} numberOfLines={1}>
          {message.listingTitle}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          numberOfLines={1}
        >
          {message.lastMessage}
        </ThemedText>
      </View>
      {message.unread ? (
        <View style={styles.unreadBadge} />
      ) : null}
    </AnimatedPressable>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<RootNavProp>();

  const renderItem = ({ item }: { item: Message }) => (
    <MessageItem message={item} onPress={() => {}} />
  );

  const handleSignIn = () => {
    navigation.navigate("SignIn");
  };

  const handleCreateAccount = () => {
    navigation.navigate("CreateAccount");
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText type="h2">Messages</ThemedText>
        </View>
        <View style={[styles.signInPrompt, { paddingBottom: tabBarHeight + Spacing.xl }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h4" style={styles.promptTitle}>
            Sign in to view messages
          </ThemedText>
          <ThemedText type="body" style={[styles.promptText, { color: theme.textSecondary }]}>
            Connect with hosts and manage your rental conversations
          </ThemedText>
          <View style={styles.authButtons}>
            <Pressable style={styles.primaryButton} onPress={handleSignIn}>
              <ThemedText type="body" style={styles.primaryButtonText}>
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.secondaryButton, { borderColor: Colors.light.primary }]} 
              onPress={handleCreateAccount}
            >
              <ThemedText type="body" style={{ color: Colors.light.primary, fontWeight: "600" }}>
                Create Account
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Messages</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {user.displayName}
        </ThemedText>
      </View>

      <FlatList
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
              No messages yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Start a conversation by contacting a host about their listing
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
    marginTop: Spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  signInPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  promptTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  promptText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  authButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  primaryButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
