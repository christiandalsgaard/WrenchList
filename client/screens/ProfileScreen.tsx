import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
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
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

// Two navigation types: root stack for modals (SignIn, CreateAccount) and profile stack for sub-screens
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;
type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  badgeCount?: number;
  danger?: boolean;
  disabled?: boolean;
}

function MenuItem({ icon, label, onPress, badgeCount, danger, disabled }: MenuItemProps) {
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
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      style={[styles.menuItem, animatedStyle, disabled && { opacity: 0.4 }]}
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
      {/* Show badge only when count > 0 */}
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.badge}>
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {badgeCount}
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
  const { user, signOut } = useAuth();

  // Root navigation for modals (SignIn, CreateAccount)
  const rootNav = useNavigation<RootNavProp>();
  // Profile stack navigation for sub-screens
  const profileNav = useNavigation<ProfileNavProp>();

  // Fetch real saved listings count for badge
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setSavedCount(0);
      return;
    }
    // Fetch saved listing count from API
    const fetchCount = async () => {
      try {
        const res = await fetch(
          new URL(`/api/users/${user.id}/saved-listings/count`, getApiUrl()).toString()
        );
        if (res.ok) {
          const data = await res.json();
          setSavedCount(data.count || 0);
        }
      } catch {
        // Silently fail — badge just won't show
      }
    };
    fetchCount();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    rootNav.navigate("SignIn");
  };

  const handleCreateAccount = () => {
    rootNav.navigate("CreateAccount");
  };

  // Guard: require auth for ACCOUNT and SETTINGS items
  const requireAuth = (screen: keyof ProfileStackParamList) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to access this feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: handleSignIn },
      ]);
      return;
    }
    profileNav.navigate(screen);
  };

  const displayName = user?.displayName || "Guest User";
  const userRole = user?.role || "customer";
  const userLocation = user?.city && user?.state
    ? `${user.city}, ${user.state}`
    : user?.city || "Location not set";
  const userInitials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : null;

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
        {/* --- Profile header with avatar, name, role badge, email, location --- */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: user ? Colors.light.primary : theme.backgroundSecondary }]}>
            {userInitials ? (
              <ThemedText type="h3" style={{ color: "#FFFFFF" }}>
                {userInitials}
              </ThemedText>
            ) : (
              <Feather name="user" size={40} color={theme.textSecondary} />
            )}
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {displayName}
          </ThemedText>
          <View style={[styles.userTypeBadge, { backgroundColor: Colors.light.secondary + "20" }]}>
            <ThemedText type="caption" style={{ color: Colors.light.secondary, fontWeight: "600" }}>
              {userRole === "host" ? "Host" : "Customer"}
            </ThemedText>
          </View>
          {user ? (
            <>
              <ThemedText type="small" style={[styles.userInfo, { color: theme.textSecondary }]}>
                {user.email}
              </ThemedText>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {userLocation}
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText type="small" style={[styles.userInfo, { color: theme.textSecondary }]}>
              Sign in to access your profile
            </ThemedText>
          )}
        </View>

        {/* --- Auth buttons for unauthenticated users --- */}
        {!user ? (
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
        ) : null}

        {/* --- ACCOUNT section: Booking History, Saved Listings, Payment Methods --- */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT
          </ThemedText>
          <MenuItem
            icon="calendar"
            label="Booking History"
            onPress={() => requireAuth("BookingHistory")}
            disabled={!user}
          />
          <MenuItem
            icon="heart"
            label="Saved Listings"
            onPress={() => requireAuth("SavedListings")}
            badgeCount={savedCount}
            disabled={!user}
          />
          <MenuItem
            icon="credit-card"
            label="Payment Methods"
            onPress={() => requireAuth("PaymentMethods")}
            disabled={!user}
          />
        </View>

        {/* --- SETTINGS section: Notifications, Location Preferences --- */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SETTINGS
          </ThemedText>
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => requireAuth("Notifications")}
            disabled={!user}
          />
          <MenuItem
            icon="map-pin"
            label="Location Preferences"
            onPress={() => requireAuth("LocationPreferences")}
            disabled={!user}
          />
        </View>

        {/* --- SUPPORT section: Help, Terms, Privacy (accessible without auth) --- */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SUPPORT
          </ThemedText>
          <MenuItem icon="help-circle" label="Help & Support" onPress={() => profileNav.navigate("HelpSupport")} />
          <MenuItem icon="file-text" label="Terms of Service" onPress={() => profileNav.navigate("TermsOfService")} />
          <MenuItem icon="shield" label="Privacy Policy" onPress={() => profileNav.navigate("PrivacyPolicy")} />
        </View>

        {/* --- Sign Out button (only when authenticated) --- */}
        {user ? (
          <View style={styles.section}>
            <MenuItem icon="log-out" label="Sign Out" onPress={handleSignOut} danger />
          </View>
        ) : null}

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
    paddingHorizontal: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
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
  userInfo: {
    marginTop: Spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  authButtons: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
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
