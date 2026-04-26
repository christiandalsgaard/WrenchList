import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Switch, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";

// Notification preference keys and their display labels/descriptions
interface NotificationPrefs {
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
}

const PREF_CONFIG = [
  {
    key: "bookingUpdates" as const,
    label: "Booking Updates",
    description: "Get notified about booking confirmations, reminders, and status changes.",
    icon: "calendar" as const,
  },
  {
    key: "messages" as const,
    label: "Messages",
    description: "Receive notifications when you get a new message from a host or renter.",
    icon: "message-circle" as const,
  },
  {
    key: "promotions" as const,
    label: "Promotions & Deals",
    description: "Stay updated on special offers, discounts, and new features.",
    icon: "tag" as const,
  },
];

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    bookingUpdates: true,
    messages: true,
    promotions: false,
  });
  const [loading, setLoading] = useState(true);

  // Fetch current notification preferences from API
  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      try {
        const res = await fetch(
          new URL(`/api/users/${user.id}/notification-preferences`, getApiUrl()).toString()
        );
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPrefs(data.preferences);
          }
        }
      } catch {
        // Use defaults on failure
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [user]);

  // Toggle a preference — optimistic update, revert on API failure
  const togglePref = useCallback(
    async (key: keyof NotificationPrefs) => {
      if (!user) return;

      const prev = { ...prefs };
      const updated = { ...prefs, [key]: !prefs[key] };

      // Optimistic: apply change immediately for responsive UI
      setPrefs(updated);

      try {
        const res = await fetch(
          new URL(`/api/users/${user.id}/notification-preferences`, getApiUrl()).toString(),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          }
        );
        if (!res.ok) throw new Error();
      } catch {
        // Revert on failure and show error
        setPrefs(prev);
        Alert.alert("Error", "Failed to update preference. Please try again.");
      }
    },
    [user, prefs]
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Render a toggle row for each notification preference */}
        {PREF_CONFIG.map((config) => (
          <View
            key={config.key}
            style={[styles.prefRow, { borderColor: theme.border }]}
          >
            <View style={[styles.prefIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name={config.icon} size={20} color={theme.text} />
            </View>
            <View style={styles.prefText}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {config.label}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                {config.description}
              </ThemedText>
            </View>
            <Switch
              value={prefs[config.key]}
              onValueChange={() => togglePref(config.key)}
              trackColor={{ false: theme.backgroundTertiary, true: Colors.light.primary + "80" }}
              thumbColor={prefs[config.key] ? Colors.light.primary : "#F4F3F4"}
            />
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing["3xl"] },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  prefIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  prefText: {
    flex: 1,
  },
});
