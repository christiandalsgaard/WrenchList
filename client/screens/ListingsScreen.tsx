import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import * as Location from "expo-location";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NativeMap } from "@/components/NativeMap";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ExploreStackParamList } from "@/navigation/ExploreStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getMockListings, Listing } from "@/lib/mockData";
import { useFilters } from "@/lib/filterContext";

type RouteProps = RouteProp<ExploreStackParamList, "Listings">;
type NavigationProp = NativeStackNavigationProp<ExploreStackParamList, "Listings">;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

function ListingCard({ listing, onPress }: ListingCardProps) {
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
        styles.listingCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.imagePlaceholder} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="image" size={32} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.listingInfo}>
        <ThemedText type="body" style={styles.listingTitle} numberOfLines={1}>
          {listing.title}
        </ThemedText>
        <ThemedText type="price" style={{ color: Colors.light.primary }}>
          ${listing.pricePerDay}/day
        </ThemedText>
        <View style={styles.listingMeta}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {listing.city}, {listing.state}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="star" size={12} color={Colors.light.accent} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {listing.rating.toFixed(1)}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  const { theme } = useTheme();
  
  return (
    <Animated.View
      entering={FadeIn}
      style={[styles.filterChip, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ThemedText type="caption">{label}</ThemedText>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Feather name="x" size={14} color={theme.text} />
      </Pressable>
    </Animated.View>
  );
}

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const { categoryId, categoryName } = route.params;
  const { filters, clearFilter, clearAllFilters } = useFilters();
  
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const listings = useMemo(() => {
    return getMockListings(categoryId, filters, userLocation);
  }, [categoryId, filters, userLocation]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    })();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {Platform.OS !== "web" ? (
            <HeaderButton
              onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
            >
              <Feather
                name={viewMode === "list" ? "map" : "list"}
                size={22}
                color={theme.text}
              />
            </HeaderButton>
          ) : null}
          <HeaderButton
            onPress={() => rootNavigation.navigate("FilterModal", { categoryId })}
          >
            <Feather name="sliders" size={22} color={theme.text} />
          </HeaderButton>
        </View>
      ),
    });
  }, [viewMode, theme, navigation, rootNavigation, categoryId]);

  const handleListingPress = (listingId: string) => {
    navigation.navigate("ListingDetail", { listingId });
  };

  const activeFilters = [];
  if (filters.city) activeFilters.push({ key: "city", label: filters.city });
  if (filters.region) activeFilters.push({ key: "region", label: filters.region });
  if (filters.state) activeFilters.push({ key: "state", label: filters.state });
  if (filters.proximityMiles) activeFilters.push({ key: "proximityMiles", label: `Within ${filters.proximityMiles} mi` });

  const renderListItem = ({ item }: { item: Listing }) => (
    <ListingCard listing={item} onPress={() => handleListingPress(item.id)} />
  );

  const initialRegion = userLocation
    ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  const markers = listings.map((listing) => ({
    id: listing.id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    onPress: () => setSelectedListing(listing),
    children: (
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            ${listing.pricePerDay}
          </ThemedText>
        </View>
      </View>
    ),
  }));

  return (
    <ThemedView style={styles.container}>
      {activeFilters.length > 0 ? (
        <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
          {activeFilters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              onRemove={() => clearFilter(filter.key as keyof typeof filters)}
            />
          ))}
          <Pressable onPress={clearAllFilters} hitSlop={8}>
            <ThemedText type="caption" style={{ color: Colors.light.primary }}>
              Clear all
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {viewMode === "list" || Platform.OS === "web" ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing["5xl"] },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
                No listings found
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Try adjusting your filters or search in a different area
              </ThemedText>
            </View>
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          <NativeMap
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
            markers={markers}
          />
          
          {selectedListing ? (
            <Animated.View
              entering={FadeIn}
              style={[
                styles.mapCard,
                { 
                  backgroundColor: theme.cardBackground,
                  bottom: insets.bottom + Spacing.xl,
                },
              ]}
            >
              <Pressable
                onPress={() => handleListingPress(selectedListing.id)}
                style={styles.mapCardContent}
              >
                {selectedListing.imageUrl ? (
                  <Image source={{ uri: selectedListing.imageUrl }} style={styles.mapCardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.mapCardImage, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="image" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.mapCardInfo}>
                  <ThemedText type="body" numberOfLines={1}>
                    {selectedListing.title}
                  </ThemedText>
                  <ThemedText type="price" style={{ color: Colors.light.primary }}>
                    ${selectedListing.pricePerDay}/day
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {selectedListing.city}, {selectedListing.state}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => setSelectedListing(null)}
                style={styles.mapCardClose}
              >
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  row: {
    gap: Spacing.lg,
  },
  listingCard: {
    flex: 1,
    maxWidth: (SCREEN_WIDTH - Spacing.lg * 3) / 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePlaceholder: {
    aspectRatio: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  listingInfo: {
    padding: Spacing.md,
  },
  listingTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  listingMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.sm,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  mapCard: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  mapCardImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCardInfo: {
    flex: 1,
  },
  mapCardClose: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
});
