import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useFilters, FilterState } from "@/lib/filterContext";

type RouteProps = RouteProp<RootStackParamList, "FilterModal">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATES = ["California", "Texas", "New York", "Florida", "Illinois"];
const REGIONS = ["Bay Area", "Central Valley", "SoCal", "North State"];
const CITIES = ["San Francisco", "Oakland", "San Jose", "Fremont", "Palo Alto"];
const PROXIMITY_OPTIONS = [5, 10, 25, 50];

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function SelectChip({ label, selected, onPress }: SelectChipProps) {
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
        styles.selectChip,
        {
          backgroundColor: selected ? Colors.light.primary : theme.backgroundSecondary,
          borderColor: selected ? Colors.light.primary : theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: selected ? "#FFFFFF" : theme.text, fontWeight: selected ? "600" : "400" }}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function FilterModal() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { filters, updateFilters, clearAllFilters } = useFilters();
  
  const [localFilters, setLocalFilters] = useState<FilterState>({
    city: filters.city,
    region: filters.region,
    state: filters.state,
    proximityMiles: filters.proximityMiles,
  });
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasLocation(status === "granted");
    })();
  }, []);

  const handleApply = () => {
    updateFilters(localFilters);
    navigation.goBack();
  };

  const handleClear = () => {
    setLocalFilters({
      city: null,
      region: null,
      state: null,
      proximityMiles: null,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["5xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            State
          </ThemedText>
          <View style={styles.chipGrid}>
            {STATES.map((state) => (
              <SelectChip
                key={state}
                label={state}
                selected={localFilters.state === state}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    state: prev.state === state ? null : state,
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Region
          </ThemedText>
          <View style={styles.chipGrid}>
            {REGIONS.map((region) => (
              <SelectChip
                key={region}
                label={region}
                selected={localFilters.region === region}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    region: prev.region === region ? null : region,
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            City
          </ThemedText>
          <View style={styles.chipGrid}>
            {CITIES.map((city) => (
              <SelectChip
                key={city}
                label={city}
                selected={localFilters.city === city}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    city: prev.city === city ? null : city,
                  }))
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Proximity to You
            </ThemedText>
            {!hasLocation ? (
              <View style={styles.locationWarning}>
                <Feather name="alert-circle" size={14} color={Colors.light.accent} />
                <ThemedText type="caption" style={{ color: Colors.light.accent }}>
                  Enable location for this filter
                </ThemedText>
              </View>
            ) : null}
          </View>
          <View style={styles.chipGrid}>
            {PROXIMITY_OPTIONS.map((miles) => (
              <SelectChip
                key={miles}
                label={`${miles} miles`}
                selected={localFilters.proximityMiles === miles}
                onPress={() => {
                  if (!hasLocation) return;
                  setLocalFilters((prev) => ({
                    ...prev,
                    proximityMiles: prev.proximityMiles === miles ? null : miles,
                  }));
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Clear All
          </ThemedText>
        </Pressable>
        <Button onPress={handleApply} style={styles.applyButton}>
          Apply Filters
        </Button>
      </View>
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
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  locationWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  selectChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  clearButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
});
