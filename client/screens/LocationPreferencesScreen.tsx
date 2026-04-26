import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";

/**
 * LocationPreferencesScreen — lets user update their city and state.
 * Pre-fills from current user data. On save, PATCHes the user profile
 * and updates AuthContext so the change reflects immediately in the UI.
 */
export default function LocationPreferencesScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();

  // Pre-fill with existing user location data
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch(
        new URL(`/api/users/${user.id}`, getApiUrl()).toString(),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: city.trim() || null, state: state.trim() || null }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update location");
      }

      // Update local auth state so the Profile screen reflects the change immediately
      await updateUser({ city: city.trim() || null, state: state.trim() || null });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* City input */}
        <View style={styles.fieldGroup}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            City
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={city}
            onChangeText={setCity}
            placeholder="Enter your city"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
          />
        </View>

        {/* State input */}
        <View style={styles.fieldGroup}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            State
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={state}
            onChangeText={setState}
            placeholder="Enter your state"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
          />
        </View>

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Save Location
            </ThemedText>
          )}
        </Pressable>

        <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
          Your location helps us show nearby tool listings and calculate rental distances.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing["3xl"] },
  fieldGroup: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  hint: {
    textAlign: "center",
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
