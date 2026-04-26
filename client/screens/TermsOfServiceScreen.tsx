import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

/**
 * TermsOfServiceScreen — static legal content screen.
 * Placeholder text that covers the essential sections a tool rental
 * marketplace would need. Should be replaced with real legal copy.
 */

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing and using WrenchList, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the service.",
  },
  {
    title: "2. Description of Service",
    body: "WrenchList is a peer-to-peer marketplace that connects tool owners (hosts) with individuals who need to rent tools (customers). We facilitate the listing, discovery, and booking of tools but are not a party to the rental agreement between hosts and customers.",
  },
  {
    title: "3. User Accounts",
    body: "You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activities that occur under it. Notify us immediately if you suspect unauthorized access.",
  },
  {
    title: "4. Listing and Renting Tools",
    body: "Hosts are responsible for ensuring their tools are in safe working condition, accurately described, and available for the listed dates. Customers must return tools in the same condition they were received, normal wear and tear excluded.",
  },
  {
    title: "5. Fees and Payments",
    body: "WrenchList may charge service fees for facilitating transactions. All fees will be clearly displayed before a booking is confirmed. Payment terms and methods will be specified at the time of booking.",
  },
  {
    title: "6. Liability and Insurance",
    body: "WrenchList is not responsible for damage to tools, personal injury, or property damage arising from the use of rented tools. Users are encouraged to obtain appropriate insurance coverage. Hosts and customers agree to resolve disputes directly.",
  },
  {
    title: "7. Prohibited Conduct",
    body: "Users may not use WrenchList for any illegal purposes, misrepresent themselves or their tools, harass other users, or attempt to circumvent the platform's fees or policies.",
  },
  {
    title: "8. Termination",
    body: "We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful behavior. Users may delete their accounts at any time through their profile settings.",
  },
  {
    title: "9. Changes to Terms",
    body: "We may update these terms from time to time. Continued use of the service after changes are posted constitutes acceptance of the updated terms. We will notify users of material changes via email or in-app notification.",
  },
  {
    title: "10. Contact",
    body: "For questions about these Terms of Service, contact us at legal@wrenchlist.com.",
  },
];

export default function TermsOfServiceScreen() {
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
