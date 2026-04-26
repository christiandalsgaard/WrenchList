import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NativeMap } from "@/components/NativeMap";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ExploreStackParamList } from "@/navigation/ExploreStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getMockListingById } from "@/lib/mockData";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";

type RouteProps = RouteProp<ExploreStackParamList, "ListingDetail">;
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<RootNavProp>();
  const { user } = useAuth();
  const { listingId } = route.params;

  const listing = getMockListingById(listingId);

  // Track whether this listing is saved/favorited by the current user
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Check if listing is already saved when screen loads
  useEffect(() => {
    if (!user || !listing) return;
    const checkSaved = async () => {
      try {
        const res = await fetch(
          new URL(`/api/users/${user.id}/saved-listings`, getApiUrl()).toString()
        );
        if (res.ok) {
          const data = await res.json();
          const saved = (data.data || []).some((item: any) => item.id === listingId);
          setIsSaved(saved);
        }
      } catch {
        // Silently fail — heart just defaults to unsaved
      }
    };
    checkSaved();
  }, [user, listingId]);

  // Toggle save/unsave listing with optimistic update
  const handleToggleSave = useCallback(async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save listings.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("SignIn") },
      ]);
      return;
    }
    if (savingInProgress) return;

    const wasSaved = isSaved;
    setIsSaved(!wasSaved); // Optimistic toggle
    setSavingInProgress(true);

    try {
      if (wasSaved) {
        // Unsave: DELETE /api/users/:id/saved-listings/:listingId
        const res = await fetch(
          new URL(`/api/users/${user.id}/saved-listings/${listingId}`, getApiUrl()).toString(),
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error();
      } else {
        // Save: POST /api/users/:id/saved-listings
        const res = await fetch(
          new URL(`/api/users/${user.id}/saved-listings`, getApiUrl()).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          }
        );
        if (!res.ok) throw new Error();
      }
    } catch {
      // Revert on failure
      setIsSaved(wasSaved);
      Alert.alert("Error", "Failed to update saved listing. Please try again.");
    } finally {
      setSavingInProgress(false);
    }
  }, [user, isSaved, listingId, savingInProgress]);

  // Contact host — sends initial message and navigates to Messages tab
  const handleContact = useCallback(() => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to contact the host.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("SignIn") },
      ]);
      return;
    }
    if (!listing) return;

    // Send an introductory message to the host via API, then switch to Messages tab
    Alert.alert(
      "Contact Host",
      `Send a message to ${listing.hostName} about "${listing.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Message",
          onPress: async () => {
            try {
              const res = await fetch(
                new URL("/api/messages", getApiUrl()).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    senderId: user.id,
                    receiverId: listing.hostId,
                    listingId: listing.id,
                    content: `Hi! I'm interested in renting your "${listing.title}". Is it available?`,
                  }),
                }
              );
              if (!res.ok) throw new Error();
              // Navigate to the Messages tab so user can see the conversation
              navigation.getParent()?.navigate("MessagesTab");
            } catch {
              Alert.alert("Error", "Failed to send message. Please try again.");
            }
          },
        },
      ]
    );
  }, [user, listing]);

  // Book Now — shows confirmation with price details, creates booking via API
  const handleBookNow = useCallback(() => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to book a tool.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("SignIn") },
      ]);
      return;
    }
    if (!listing) return;

    // Simple booking flow: confirm a 1-day rental at the daily price
    const priceCents = listing.pricePerDay * 100;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const startDate = tomorrow.toISOString().split("T")[0];
    const endDate = dayAfter.toISOString().split("T")[0];

    Alert.alert(
      "Confirm Booking",
      `Book "${listing.title}" for 1 day?\n\nDates: ${startDate} → ${endDate}\nTotal: $${listing.pricePerDay}\n\nThe host will be notified of your request.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Booking",
          onPress: async () => {
            try {
              const res = await fetch(
                new URL("/api/bookings", getApiUrl()).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    listingId: listing.id,
                    customerId: user.id,
                    hostId: listing.hostId,
                    startDate,
                    endDate,
                    totalPriceCents: priceCents,
                  }),
                }
              );

              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                // Handle booking overlap (409 Conflict)
                if (res.status === 409) {
                  Alert.alert("Not Available", "This tool is already booked for those dates. Please try different dates.");
                  return;
                }
                throw new Error(data.error || "Booking failed");
              }

              Alert.alert(
                "Booking Confirmed!",
                "Your booking request has been sent to the host. Check your Booking History for updates.",
                [{ text: "OK" }]
              );
            } catch (err: any) {
              Alert.alert("Booking Failed", err.message || "Something went wrong. Please try again.");
            }
          },
        },
      ]
    );
  }, [user, listing]);

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

  const markers = [{
    id: listing.id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    children: (
      <View style={styles.locationMarker}>
        <Feather name="map-pin" size={24} color={Colors.light.primary} />
      </View>
    ),
  }];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image placeholder with save/heart button overlay */}
        <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="image" size={64} color={theme.textSecondary} />
          {/* Heart/save button in top-right corner */}
          <Pressable
            style={[styles.saveButton, { backgroundColor: "rgba(0,0,0,0.4)" }]}
            onPress={handleToggleSave}
          >
            <Feather
              name={isSaved ? "heart" : "heart"}
              size={22}
              color={isSaved ? Colors.light.error : "#FFFFFF"}
            />
          </Pressable>
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
            <NativeMap
              style={styles.map}
              initialRegion={{
                latitude: listing.latitude,
                longitude: listing.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              markers={markers}
            />
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

        {/* Spacer so content doesn't hide behind bottom bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar with Contact and Book Now buttons */}
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
          onPress={handleContact}
        >
          <Feather name="message-circle" size={20} color={Colors.light.primary} />
          <ThemedText type="body" style={{ color: Colors.light.primary, fontWeight: "600" }}>
            Contact
          </ThemedText>
        </AnimatedPressable>
        <Button onPress={handleBookNow} style={styles.bookButton}>
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
    position: "relative",
  },
  saveButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
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
  locationMarker: {
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
