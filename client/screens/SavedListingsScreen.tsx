import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

// Listing type matching the server schema (subset of fields used in display)
interface SavedListing {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  priceHourlyCents: number | null;
  priceDailyCents: number | null;
  priceWeeklyCents: number | null;
  imageUrl: string | null;
}

function formatPrice(cents: number | null): string {
  if (!cents) return "—";
  return `$${(cents / 100).toFixed(0)}`;
}

export default function SavedListingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const rootNav = useNavigation<RootNavProp>();

  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved listings from API
  const fetchSaved = useCallback(
    async () => {
      if (!user) return;
      try {
        const res = await fetch(
          new URL(`/api/users/${user.id}/saved-listings`, getApiUrl()).toString()
        );
        if (!res.ok) throw new Error("Failed to load saved listings");
        const data = await res.json();
        setListings(data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchSaved();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaved();
  };

  // Unsave a listing — remove from local state immediately (optimistic), revert on failure
  const handleUnsave = (listingId: string) => {
    Alert.alert("Remove Saved Listing", "Are you sure you want to unsave this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          // Optimistic removal
          const prev = listings;
          setListings((l) => l.filter((item) => item.id !== listingId));
          try {
            const res = await fetch(
              new URL(`/api/users/${user!.id}/saved-listings/${listingId}`, getApiUrl()).toString(),
              { method: "DELETE" }
            );
            if (!res.ok) throw new Error();
          } catch {
            // Revert on failure
            setListings(prev);
            Alert.alert("Error", "Failed to remove listing. Please try again.");
          }
        },
      },
    ]);
  };

  // Render each saved listing as a card with image, title, location, price, unsave button
  const renderListing = ({ item }: { item: SavedListing }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => rootNav.navigate("GlobalListingDetail", { listingId: item.id })}
    >
      {/* Listing image or placeholder */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
          <Feather name="image" size={24} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.cardContent}>
        <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
          {item.title}
        </ThemedText>
        {item.city ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.city}{item.state ? `, ${item.state}` : ""}
            </ThemedText>
          </View>
        ) : null}
        <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: "600", marginTop: Spacing.xs }}>
          {item.priceDailyCents ? `${formatPrice(item.priceDailyCents)}/day` : formatPrice(item.priceHourlyCents) + "/hr"}
        </ThemedText>
      </View>
      {/* Unsave heart button */}
      <Pressable style={styles.heartButton} onPress={() => handleUnsave(item.id)}>
        <Feather name="heart" size={20} color={Colors.light.error} />
      </Pressable>
    </Pressable>
  );

  // Empty state
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="heart" size={48} color={theme.textSecondary} />
        </View>
        <ThemedText type="h4" style={styles.emptyTitle}>
          No saved listings
        </ThemedText>
        <ThemedText type="small" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Tap the heart icon on any listing to save it here for later.
        </ThemedText>
      </View>
    );
  };

  if (error && listings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorState}>
          <Feather name="alert-circle" size={48} color={Colors.light.error} />
          <ThemedText type="body" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={fetchSaved}>
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
            listings.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.xl },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorState: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  retryButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  card: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  heartButton: {
    padding: Spacing.md,
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: { marginBottom: Spacing.sm },
  emptySubtitle: { textAlign: "center" },
});
