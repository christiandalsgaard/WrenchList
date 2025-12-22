import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, Platform, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NativeMap } from "@/components/NativeMap";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, ListingCategories } from "@/constants/theme";
import { getAllMockListings, Listing } from "@/lib/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ListingListItem({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getCategoryIcon = (categoryId: string): keyof typeof Feather.glyphMap => {
    const category = ListingCategories.find((c) => c.id === categoryId);
    return category?.icon || "tool";
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[
        styles.listItem,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={[styles.listItemImage, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={getCategoryIcon(listing.categoryId)} size={24} color={theme.textSecondary} />
      </View>
      <View style={styles.listItemInfo}>
        <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
          {listing.title}
        </ThemedText>
        <ThemedText type="price" style={{ color: Colors.light.primary }}>
          ${listing.pricePerDay}/day
        </ThemedText>
        <View style={styles.listItemMeta}>
          <Feather name="map-pin" size={12} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {listing.city}, {listing.state}
          </ThemedText>
          <View style={styles.rating}>
            <Feather name="star" size={12} color={Colors.light.accent} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {listing.rating.toFixed(1)}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<RootNavigationProp>();
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const listings = useMemo(() => getAllMockListings(), []);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        setLocationPermission(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    })();
  }, []);

  const getCategoryIcon = (categoryId: string): keyof typeof Feather.glyphMap => {
    const category = ListingCategories.find((c) => c.id === categoryId);
    return category?.icon || "tool";
  };

  const initialRegion = userLocation
    ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      };

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.webHeader, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText type="h2">All Listings</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Map view available in Expo Go
          </ThemedText>
        </View>
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingListItem listing={item} onPress={() => navigation.navigate("GlobalListingDetail", { listingId: item.id })} />
          )}
          contentContainerStyle={[
            styles.webListContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    );
  }

  if (locationPermission === false) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Feather name="map-pin" size={48} color={theme.textSecondary} />
        <ThemedText type="h4" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
          Location Access Required
        </ThemedText>
        <ThemedText
          type="body"
          style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm, paddingHorizontal: Spacing["2xl"] }}
        >
          Enable location access to see listings near you on the map
        </ThemedText>
        <Pressable
          onPress={async () => {
            try {
              const { openSettings } = await import("expo-linking");
              await openSettings();
            } catch (e) {}
          }}
          style={[styles.settingsButton, { backgroundColor: Colors.light.primary }]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Open Settings
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const markers = listings.map((listing) => ({
    id: listing.id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    onPress: () => setSelectedListing(listing),
    children: (
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <Feather
            name={getCategoryIcon(listing.categoryId)}
            size={16}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.markerPointer} />
      </View>
    ),
  }));

  return (
    <ThemedView style={styles.container}>
      <NativeMap
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        markers={markers}
      />

      <View style={[styles.header, { top: insets.top + Spacing.md }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Search all listings...
          </ThemedText>
        </View>
      </View>

      {selectedListing ? (
        <Animated.View
          entering={FadeIn}
          style={[
            styles.listingCard,
            {
              backgroundColor: theme.cardBackground,
              bottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              navigation.navigate("GlobalListingDetail", { listingId: selectedListing.id });
            }}
            style={styles.cardContent}
          >
            <View style={[styles.cardImage, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name={getCategoryIcon(selectedListing.categoryId)} size={24} color={theme.textSecondary} />
            </View>
            <View style={styles.cardInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                {selectedListing.title}
              </ThemedText>
              <ThemedText type="price" style={{ color: Colors.light.primary }}>
                ${selectedListing.pricePerDay}/day
              </ThemedText>
              <View style={styles.cardMeta}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {selectedListing.city}, {selectedListing.state}
                </ThemedText>
                <View style={styles.rating}>
                  <Feather name="star" size={12} color={Colors.light.accent} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {selectedListing.rating.toFixed(1)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setSelectedListing(null)} style={styles.closeButton}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      ) : null}
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
  map: {
    flex: 1,
  },
  webHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  webListContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemInfo: {
    flex: 1,
  },
  listItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  header: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    backgroundColor: Colors.light.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.light.primary,
    marginTop: -1,
  },
  listingCard: {
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
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: Spacing.sm,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  settingsButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
