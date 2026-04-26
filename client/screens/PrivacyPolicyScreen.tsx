import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

/**
 * PrivacyPolicyScreen — static legal content screen.
 * Placeholder privacy policy text covering data collection, usage,
 * and user rights for a peer-to-peer tool rental marketplace.
 */

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide when creating an account, including your name, email address, phone number, and location. We also collect usage data such as browsing activity, search queries, and booking history to improve our service.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to provide and improve our services, facilitate bookings between hosts and customers, send notifications about your account and bookings, and personalize your experience with relevant listings and recommendations.",
  },
  {
    title: "3. Information Sharing",
    body: "We share limited profile information (name, city, and ratings) with other users to facilitate rentals. We do not sell your personal information to third parties. We may share data with service providers who help operate our platform.",
  },
  {
    title: "4. Location Data",
    body: "We collect location data you provide (city, state) to show nearby listings and calculate distances. If you grant permission, we may also use your device's location for real-time proximity features. You can disable location services at any time.",
  },
  {
    title: "5. Data Security",
    body: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest. Passwords are hashed and never stored in plain text. However, no system is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "6. Data Retention",
    body: "We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required by law to retain certain information.",
  },
  {
    title: "7. Your Rights",
    body: "You have the right to access, correct, or delete your personal data. You can update your profile information at any time through the app. To request data deletion, contact us at privacy@wrenchlist.com.",
  },
  {
    title: "8. Cookies and Tracking",
    body: "Our web platform uses cookies and similar technologies to maintain your session and remember your preferences. Our mobile app uses local storage for similar purposes. You can manage cookie preferences in your browser settings.",
  },
  {
    title: "9. Children's Privacy",
    body: "WrenchList is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover we have collected data from a minor, we will delete it promptly.",
  },
  {
    title: "10. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the service after changes are posted constitutes acceptance.",
  },
  {
    title: "11. Contact Us",
    body: "For questions about this Privacy Policy or your data, contact us at privacy@wrenchlist.com.",
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="caption" style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          Last updated: April 2026
        </ThemedText>

        {SECTIONS.map((section, index) => (
          <React.Fragment key={index}>
            <ThemedText type="body" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionBody, { color: theme.textSecondary }]}>
              {section.body}
            </ThemedText>
          </React.Fragment>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl },
  lastUpdated: { marginBottom: Spacing.xl, textAlign: "center" },
  sectionTitle: { fontWeight: "600", marginBottom: Spacing.sm, marginTop: Spacing.lg },
  sectionBody: { lineHeight: 20 },
});
