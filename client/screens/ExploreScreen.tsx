import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, ImageBackground } from "react-native";
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
import { Colors, Spacing, BorderRadius, ListingCategories } from "@/constants/theme";
import { ExploreStackParamList } from "@/navigation/ExploreStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import MenuModal from "@/screens/MenuModal";
import { useAuth } from "@/lib/authContext";

const workshopImage = require("../../attached_assets/stock_images/professional_worksho_eab1201f.jpg");
const midSizeImage = require("../../attached_assets/stock_images/power_equipment_chai_70088427.jpg");
const powerToolsImage = require("../../attached_assets/stock_images/power_tools_drill_sa_184c00d0.jpg");

type ExploreNavProp = NativeStackNavigationProp<ExploreStackParamList, "Explore">;
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryImages: Record<string, any> = {
  "workshop": workshopImage,
  "mid-size-equipment": midSizeImage,
  "power-tools": powerToolsImage,
};

interface CategoryCardProps {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  onPress: () => void;
}

function CategoryCard({ id, name, icon, description, onPress }: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const image = categoryImages[id];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.categoryCard, animatedStyle]}
    >
      <ImageBackground
        source={image}
        style={styles.imageBackground}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Feather name={icon} size={24} color="#FFFFFF" />
          </View>
          <ThemedText type="h4" style={styles.categoryName}>
            {name}
          </ThemedText>
          <ThemedText type="small" style={styles.categoryDescription}>
            {description}
          </ThemedText>
        </View>
      </ImageBackground>
    </AnimatedPressable>
  );
}

type ModeType = "browse" | "host";

interface ModeToggleProps {
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
}

function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.toggleContainer, { backgroundColor: theme.backgroundSecondary }]}>
      <Pressable
        style={[
          styles.toggleButton,
          mode === "browse" && { backgroundColor: Colors.light.primary },
        ]}
        onPress={() => onModeChange("browse")}
      >
        <ThemedText
          type="body"
          style={[
            styles.toggleText,
            { color: mode === "browse" ? "#FFFFFF" : theme.text },
          ]}
        >
          Browse
        </ThemedText>
      </Pressable>
      <Pressable
        style={[
          styles.toggleButton,
          mode === "host" && { backgroundColor: Colors.light.primary },
        ]}
        onPress={() => onModeChange("host")}
      >
        <ThemedText
          type="body"
          style={[
            styles.toggleText,
            { color: mode === "host" ? "#FFFFFF" : theme.text },
          ]}
        >
          Host
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const exploreNavigation = useNavigation<ExploreNavProp>();
  const rootNavigation = useNavigation<RootNavProp>();
  const { user } = useAuth();
  const [mode, setMode] = useState<ModeType>("browse");
  const [menuVisible, setMenuVisible] = useState(false);

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    exploreNavigation.navigate("Listings", { categoryId, categoryName });
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleSignIn = () => {
    rootNavigation.navigate("SignIn");
  };

  const handleCreateAccount = () => {
    rootNavigation.navigate("CreateAccount");
  };

  const handleGetStarted = () => {
    if (!user) {
      rootNavigation.navigate("CreateAccount");
    } else {
      rootNavigation.navigate("CreateListing");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSignIn={handleSignIn}
        onCreateAccount={handleCreateAccount}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.topBar}>
          <View style={styles.placeholder} />
          <View style={styles.logoContainer}>
            <Feather name="tool" size={28} color={Colors.light.primary} />
            <ThemedText type="h3" style={styles.appName}>
              Wrench List
            </ThemedText>
          </View>
          <Pressable style={styles.menuButton} onPress={handleMenuPress}>
            <Feather name="menu" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <ThemedText type="body" style={[styles.tagline, { color: theme.textSecondary }]}>
            {mode === "browse" ? "Rent the right tool for the job" : "Share your tools and earn"}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <ModeToggle mode={mode} onModeChange={setMode} />

        {mode === "browse" ? (
          <View style={styles.categoriesGrid}>
            {ListingCategories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                description={category.description}
                onPress={() => handleCategoryPress(category.id, category.name)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.hostContent}>
            <View style={[styles.hostCard, { backgroundColor: theme.cardBackground }]}>
              <Feather name="plus-circle" size={48} color={Colors.light.primary} />
              <ThemedText type="h4" style={styles.hostCardTitle}>
                List Your Workshop or Equipment
              </ThemedText>
              <ThemedText type="body" style={[styles.hostCardDescription, { color: theme.textSecondary }]}>
                Start earning by renting out your tools and equipment to people in your area.
              </ThemedText>
              <Pressable style={styles.hostButton} onPress={handleGetStarted}>
                <ThemedText type="body" style={styles.hostButtonText}>
                  Get Started
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  appName: {
    color: Colors.light.primary,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  tagline: {
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#1A1A1A",
    marginBottom: Spacing.lg,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontWeight: "600",
  },
  categoriesGrid: {
    gap: Spacing.lg,
  },
  categoryCard: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    height: 192,
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  image: {
    borderRadius: BorderRadius.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  cardContent: {
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  categoryName: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  hostContent: {
    flex: 1,
  },
  hostCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  hostCardTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  hostCardDescription: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  hostButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.xs,
  },
  hostButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
