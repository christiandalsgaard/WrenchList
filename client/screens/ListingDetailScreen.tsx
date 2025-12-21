import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ExploreStackParamList } from "@/navigation/ExploreStackNavigator";
import { getMockListingById } from "@/lib/mockData";

type RouteProps = RouteProp<ExploreStackParamList, "ListingDetail">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FeatureItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}

function FeatureItem({ icon, label }: FeatureItemProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={18} color={Colors.light.primary} />
      </View>
      <ThemedText type="small">{label}</ThemedText>
    </View>
  );
}

export default function ListingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const { listingId } = route.params;
  
  const listing = getMockListingById(listingId);
  
  if (!listing) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
          Listing not found
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="image" size={64} color={theme.textSecondary} />
        </View>

        <View style={styles.infoSection}>
          <ThemedText type="h3">{listing.title}</ThemedText>
          
          <View style={styles.hostRow}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="user" size={20} color={theme.textSecondary} />
            </View>
            <View>
              <ThemedText type="body">{listing.hostName}</ThemedText>
              <View style={styles.ratingRow}>
                <Feather name="star" size={14} color={Colors.light.accent} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {listing.rating.toFixed(1)} ({listing.reviewCount} reviews)
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.priceCard, { backgroundColor: theme.backgroundDefault }]}>
            <View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Price per day
              </ThemedText>
              <ThemedText type="h2" style={{ color: Colors.light.primary }}>
                ${listing.pricePerDay}
              </ThemedText>
            </View>
            <View style={styles.priceOptions}>
              <View style={styles.priceOption}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Hourly
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  ${listing.pricePerHour}
                </ThemedText>
              </View>
              <View style={styles.priceOption}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Weekly
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  ${listing.pricePerWeek}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Description
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {listing.description}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Features
          </ThemedText>
          <View style={styles.featuresGrid}>
            {listing.features.map((feature, index) => (
              <FeatureItem key={index} icon="check-circle" label={feature} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Location
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            {listing.city}, {listing.region}, {listing.state}
          </ThemedText>
          <View style={[styles.mapContainer, { borderColor: theme.border }]}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: listing.latitude,
                longitude: listing.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              provider={PROVIDER_DEFAULT}
            >
              <Marker
                coordinate={{
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                }}
              >
                <View style={styles.marker}>
                  <Feather name="map-pin" size={24} color={Colors.light.primary} />
                </View>
              </Marker>
            </MapView>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Safety Requirements
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {listing.safetyRequirements}
          </ThemedText>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopColor: theme.border,
          },
        ]}
      >
        <AnimatedPressable
          style={[styles.contactButton, { borderColor: Colors.light.primary }]}
          onPress={() => {}}
        >
          <Feather name="message-circle" size={20} color={Colors.light.primary} />
          <ThemedText type="body" style={{ color: Colors.light.primary, fontWeight: "600" }}>
            Contact
          </ThemedText>
        </AnimatedPressable>
        <Button onPress={() => {}} style={styles.bookButton}>
          Book Now
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing["2xl"],
  },
  imageContainer: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  priceOptions: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  priceOption: {
    alignItems: "flex-end",
  },
  section: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  featuresGrid: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    height: 150,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  bookButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
});
