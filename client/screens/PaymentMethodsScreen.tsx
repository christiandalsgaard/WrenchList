import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

/**
 * PaymentMethodsScreen — static placeholder screen.
 * No backend integration yet — shows a friendly "coming soon" empty state
 * so users know the feature is planned but not yet available.
 */
export default function PaymentMethodsScreen() {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="credit-card" size={48} color={theme.textSecondary} />
        </View>
        <ThemedText type="h4" style={styles.title}>
          No payment methods on file
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Payment processing will be available soon. You'll be able to add credit cards and other payment methods here.
        </ThemedText>
        {/* Informational badge indicating feature is coming */}
        <View style={[styles.comingSoonBadge, { backgroundColor: Colors.light.secondary + "20" }]}>
          <Feather name="clock" size={14} color={Colors.light.secondary} />
          <ThemedText type="caption" style={{ color: Colors.light.secondary, fontWeight: "600" }}>
            Coming Soon
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: { marginBottom: Spacing.sm, textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: Spacing.xl, lineHeight: 20 },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
