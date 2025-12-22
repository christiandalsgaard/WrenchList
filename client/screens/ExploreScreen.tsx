import React from "react";
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

const workshopImage = require("../../attached_assets/stock_images/professional_worksho_eab1201f.jpg");
const heavyMachineryImage = require("../../attached_assets/stock_images/heavy_machinery_exca_1507963f.jpg");
const midSizeImage = require("../../attached_assets/stock_images/power_equipment_chai_70088427.jpg");
const powerToolsImage = require("../../attached_assets/stock_images/power_tools_drill_sa_184c00d0.jpg");
const handToolsImage = require("../../attached_assets/stock_images/hand_tools_wrench_ha_377bb2db.jpg");

type NavigationProp = NativeStackNavigationProp<ExploreStackParamList, "Explore">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryImages: Record<string, any> = {
  workshop: workshopImage,
  heavy_machinery: heavyMachineryImage,
  midsize_equipment: midSizeImage,
  power_tools: powerToolsImage,
  hand_tools: handToolsImage,
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

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate("Listings", { categoryId, categoryName });
  };

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
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="tool" size={32} color={Colors.light.primary} />
            <ThemedText type="h2" style={styles.appName}>
              Wrench List
            </ThemedText>
          </View>
          <ThemedText type="body" style={[styles.tagline, { color: theme.textSecondary }]}>
            Rent the right tool for the job
          </ThemedText>
        </View>

        <ThemedText type="h3" style={styles.sectionTitle}>
          Browse Categories
        </ThemedText>

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
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  appName: {
    color: Colors.light.primary,
  },
  tagline: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  categoriesGrid: {
    gap: Spacing.lg,
  },
  categoryCard: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    height: 160,
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
});
