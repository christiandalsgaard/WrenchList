import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
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

type NavigationProp = NativeStackNavigationProp<ExploreStackParamList, "Explore">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryCardProps {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  onPress: () => void;
}

function CategoryCard({ id, name, icon, description, onPress }: CategoryCardProps) {
  const { theme } = useTheme();
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

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.categoryCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.light.primary + "15" }]}>
        <Feather name={icon} size={28} color={Colors.light.primary} />
      </View>
      <ThemedText type="h4" style={styles.categoryName}>
        {name}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {description}
      </ThemedText>
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
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
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
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  categoriesGrid: {
    gap: Spacing.lg,
  },
  categoryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  categoryName: {
    marginBottom: Spacing.xs,
  },
});
