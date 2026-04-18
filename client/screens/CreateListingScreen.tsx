import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";
import { getApiUrl } from "@/lib/query-client";

type Category = "workshop" | "equipment" | "tools";
type PriceUnit = "hour" | "day" | "week";

const categories = [
  { id: "workshop" as Category, name: "Workshop", icon: "home" as const },
  { id: "equipment" as Category, name: "Equipment", icon: "settings" as const },
  { id: "tools" as Category, name: "Tools", icon: "zap" as const },
];

const priceUnits: { id: PriceUnit; label: string }[] = [
  { id: "hour", label: "Per Hour" },
  { id: "day", label: "Per Day" },
  { id: "week", label: "Per Week" },
];

export default function CreateListingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [step, setStep] = useState<"category" | "details">("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [relativeLocation, setRelativeLocation] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("day");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectCategory = (cat: Category) => {
    setCategory(cat);
    setStep("details");
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset: { uri: string }) => asset.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");

    if (!category || !title.trim() || !description.trim() || !city.trim() || !price.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (!user) {
      setError("You must be signed in to create a listing");
      return;
    }

    setIsLoading(true);

    try {
      // Map the selected priceUnit to the correct price tier field.
      // The new schema stores separate hourly/daily/weekly prices in cents.
      const priceCents = Math.round(priceValue * 100);
      const priceFields: Record<string, number> = {};
      if (priceUnit === "hour") priceFields.priceHourlyCents = priceCents;
      if (priceUnit === "day") priceFields.priceDailyCents = priceCents;
      if (priceUnit === "week") priceFields.priceWeeklyCents = priceCents;

      const response = await fetch(new URL("/api/listings", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: user.id,
          categoryId: category,       // Changed from "category" to "categoryId"
          title: title.trim(),
          description: description.trim(),
          relativeLocation: relativeLocation.trim() || null,
          city: city.trim(),
          ...priceFields,             // Spread the correct price tier
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create listing");
        return;
      }

      navigation.goBack();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "category") {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.header}>
            <ThemedText type="h2" style={styles.title}>
              What are you listing?
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Choose a category for your listing
            </ThemedText>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleSelectCategory(cat.id)}
              >
                <View style={styles.categoryIcon}>
                  <Feather name={cat.icon} size={32} color={Colors.light.primary} />
                </View>
                <ThemedText type="h4">{cat.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => setStep("category")}>
          <Feather name="arrow-left" size={20} color={theme.text} />
          <ThemedText type="body">Change Category</ThemedText>
        </Pressable>

        <View style={styles.selectedCategory}>
          <Feather
            name={categories.find((c) => c.id === category)?.icon || "box"}
            size={20}
            color={Colors.light.primary}
          />
          <ThemedText type="body" style={{ color: Colors.light.primary }}>
            {categories.find((c) => c.id === category)?.name}
          </ThemedText>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: "rgba(244, 67, 54, 0.1)" }]}>
            <Feather name="alert-circle" size={16} color={Colors.light.error} />
            <ThemedText type="small" style={{ color: Colors.light.error }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Title *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Give your listing a title"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Description *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundSecondary, color: theme.text },
              ]}
              placeholder="Describe what you're offering"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Relative Location
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="e.g., Downtown, Near the park"
              placeholderTextColor={theme.textSecondary}
              value={relativeLocation}
              onChangeText={setRelativeLocation}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              City *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Enter your city"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Photos
            </ThemedText>
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 ? (
                <Pressable
                  style={[styles.addPhoto, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={handlePickImage}
                >
                  <Feather name="plus" size={24} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Price *
            </ThemedText>
            <View style={styles.priceRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.priceInput,
                  { backgroundColor: theme.backgroundSecondary, color: theme.text },
                ]}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
              <View style={styles.priceUnitContainer}>
                {priceUnits.map((unit) => (
                  <Pressable
                    key={unit.id}
                    style={[
                      styles.priceUnitButton,
                      priceUnit === unit.id && { backgroundColor: Colors.light.primary },
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setPriceUnit(unit.id)}
                  >
                    <ThemedText
                      type="small"
                      style={priceUnit === unit.id ? { color: "#FFFFFF" } : {}}
                    >
                      {unit.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="body" style={styles.submitButtonText}>
                Post Now
              </ThemedText>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {},
  categoryGrid: {
    gap: Spacing.lg,
  },
  categoryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  selectedCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xs,
  },
  removePhoto: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.error,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  priceRow: {
    gap: Spacing.md,
  },
  priceInput: {
    flex: 1,
  },
  priceUnitContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priceUnitButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  submitButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
