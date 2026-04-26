import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";

// Enriched booking type — includes listing title/city joined server-side
interface EnrichedBooking {
  id: string;
  listingId: string;
  customerId: string;
  hostId: string;
  startDate: string;
  endDate: string;
  totalPriceCents: number;
  status: string;
  createdAt: string;
  listingTitle: string;
  listingCity: string | null;
}

// Color-coded status badges for booking states
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3CD", text: "#856404" },
  confirmed: { bg: "#CCE5FF", text: "#004085" },
  active: { bg: "#D4EDDA", text: "#155724" },
  completed: { bg: "#E2E3E5", text: "#383D41" },
  cancelled: { bg: "#F8D7DA", text: "#721C24" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <ThemedText type="caption" style={{ color: colors.text, fontWeight: "600" }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </ThemedText>
    </View>
  );
}

// Format price from cents to dollars
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Format date string to readable short format
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor-based pagination state
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorId, setCursorId] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  // Fetch bookings from API with optional pagination cursor
  const fetchBookings = useCallback(
    async (reset = false) => {
      if (!user) return;
      try {
        // Build URL with pagination params
        const url = new URL(`/api/users/${user.id}/bookings`, getApiUrl());
        if (!reset && cursor) {
          url.searchParams.set("cursor", cursor);
          if (cursorId) url.searchParams.set("cursorId", cursorId);
        }
        url.searchParams.set("limit", "20");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load bookings");

        const data = await res.json();
        const items = data.data || [];

        if (reset) {
          setBookings(items);
        } else {
          setBookings((prev) => [...prev, ...items]);
        }

        // Update pagination cursors for next page
        setCursor(data.nextCursor ?? undefined);
        setCursorId(data.nextCursorId ?? undefined);
        setHasMore(data.hasMore ?? false);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, cursor, cursorId]
  );

  // Initial load
  useEffect(() => {
    fetchBookings(true);
  }, [user]);

  // Pull-to-refresh resets pagination and reloads from the beginning
  const onRefresh = () => {
    setRefreshing(true);
    setCursor(undefined);
    setCursorId(undefined);
    setHasMore(true);
    fetchBookings(true);
  };

  // Load next page when user scrolls to end
  const onEndReached = () => {
    if (hasMore && !loading) {
      fetchBookings(false);
    }
  };

  // Render each booking as a card with status badge, dates, price
  const renderBooking = ({ item }: { item: EnrichedBooking }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="body" style={{ fontWeight: "600", flex: 1 }} numberOfLines={1}>
          {item.listingTitle}
        </ThemedText>
        <StatusBadge status={item.status} />
      </View>
      {item.listingCity ? (
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {item.listingCity}
          </ThemedText>
        </View>
      ) : null}
      <View style={styles.cardDetails}>
        <View style={styles.dateRow}>
          <Feather name="calendar" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(item.startDate)} — {formatDate(item.endDate)}
          </ThemedText>
        </View>
        <ThemedText type="body" style={{ fontWeight: "600", color: Colors.light.primary }}>
          {formatPrice(item.totalPriceCents)}
        </ThemedText>
      </View>
    </View>
  );

  // Empty state — shown when user has no bookings at all
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="calendar" size={48} color={theme.textSecondary} />
        </View>
        <ThemedText type="h4" style={styles.emptyTitle}>
          No bookings yet
        </ThemedText>
        <ThemedText type="small" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          When you rent a tool, your booking history will appear here.
        </ThemedText>
        <Pressable
          style={styles.browseButton}
          onPress={() => navigation.getParent()?.navigate("ExploreTab")}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Browse Tools
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  // Error state
  if (error && bookings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorState}>
          <Feather name="alert-circle" size={48} color={Colors.light.error} />
          <ThemedText type="body" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={() => fetchBookings(true)}>
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
      {loading && bookings.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
            bookings.length === 0 && { flex: 1 },
          ]}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
          }
          ListFooterComponent={
            hasMore && bookings.length > 0 ? (
              <ActivityIndicator style={{ padding: Spacing.lg }} color={Colors.light.primary} />
            ) : null
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
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
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
  emptySubtitle: { textAlign: "center", marginBottom: Spacing.xl },
  browseButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
});
