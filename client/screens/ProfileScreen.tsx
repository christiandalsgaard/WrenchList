import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, showBadge, danger }: MenuItemProps) {
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
      style={[styles.menuItem, animatedStyle]}
    >
      <View style={[styles.menuIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather
          name={icon}
          size={20}
          color={danger ? Colors.light.error : theme.text}
        />
      </View>
      <ThemedText
        type="body"
        style={[styles.menuLabel, danger ? { color: Colors.light.error } : null]}
      >
        {label}
      </ThemedText>
      {showBadge ? (
        <View style={styles.badge}>
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            2
          </ThemedText>
        </View>
      ) : null}
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={40} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.userName}>
            Guest User
          </ThemedText>
          <View style={[styles.userTypeBadge, { backgroundColor: Colors.light.secondary + "20" }]}>
            <ThemedText type="caption" style={{ color: Colors.light.secondary, fontWeight: "600" }}>
              Customer
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            San Francisco, CA
          </ThemedText>
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT
          </ThemedText>
          <MenuItem icon="calendar" label="Booking History" onPress={() => {}} />
          <MenuItem icon="heart" label="Saved Listings" onPress={() => {}} showBadge />
          <MenuItem icon="credit-card" label="Payment Methods" onPress={() => {}} />
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SETTINGS
          </ThemedText>
          <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
          <MenuItem icon="map-pin" label="Location Preferences" onPress={() => {}} />
          <MenuItem icon="sliders" label="Units & Preferences" onPress={() => {}} />
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SUPPORT
          </ThemedText>
          <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="file-text" label="Terms of Service" onPress={() => {}} />
          <MenuItem icon="shield" label="Privacy Policy" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <MenuItem icon="log-out" label="Sign Out" onPress={() => {}} danger />
        </View>

        <ThemedText type="caption" style={[styles.version, { color: theme.textSecondary }]}>
          Wrench List v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  userName: {
    marginBottom: Spacing.sm,
  },
  userTypeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    alignItems: "center",
  },
  version: {
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
