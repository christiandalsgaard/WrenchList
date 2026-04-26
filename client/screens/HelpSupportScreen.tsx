import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

// FAQ items organized by topic — each can expand/collapse independently
const FAQ_ITEMS = [
  {
    question: "How do I rent a tool?",
    answer:
      "Browse listings on the Explore tab, select a tool you need, choose your rental dates, and confirm your booking. The host will be notified and can approve or decline your request.",
  },
  {
    question: "How do I list my tools for rent?",
    answer:
      "Tap the '+' button or go to your profile and select 'Create Listing'. Add photos, set your prices (hourly, daily, or weekly), and publish. You'll automatically become a host.",
  },
  {
    question: "How does payment work?",
    answer:
      "Payment processing is coming soon. Currently, payment arrangements are made directly between the renter and the host. We're working on integrated secure payments.",
  },
  {
    question: "What if a tool is damaged during my rental?",
    answer:
      "Report any damage immediately through the Messages tab by contacting the host. Document the damage with photos. We recommend both parties discuss and agree on resolution before the rental period ends.",
  },
  {
    question: "How do I cancel a booking?",
    answer:
      "Go to Booking History in your profile, find the booking, and request cancellation. Cancellation policies may vary by host. We recommend cancelling as early as possible.",
  },
  {
    question: "How do I contact support?",
    answer:
      "For urgent issues, you can reach us at support@wrenchlist.com. We aim to respond within 24 hours. For general feedback, use the in-app messaging feature.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={[styles.faqItem, { borderColor: theme.border }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.faqHeader}>
        <ThemedText type="body" style={{ fontWeight: "600", flex: 1 }}>
          {question}
        </ThemedText>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </View>
      {expanded ? (
        <ThemedText type="small" style={[styles.faqAnswer, { color: theme.textSecondary }]}>
          {answer}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export default function HelpSupportScreen() {
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
        {/* Section header */}
        <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          FREQUENTLY ASKED QUESTIONS
        </ThemedText>

        {/* Render expandable FAQ items */}
        {FAQ_ITEMS.map((item, index) => (
          <FAQItem key={index} question={item.question} answer={item.answer} />
        ))}

        {/* Contact section */}
        <View style={styles.contactSection}>
          <View style={[styles.contactIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="mail" size={24} color={Colors.light.primary} />
          </View>
          <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.md }}>
            Still need help?
          </ThemedText>
          <ThemedText type="small" style={[styles.contactText, { color: theme.textSecondary }]}>
            Contact us at support@wrenchlist.com
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl },
  sectionTitle: { marginBottom: Spacing.lg, marginLeft: Spacing.xs },
  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.lg,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqAnswer: {
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  contactSection: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    paddingVertical: Spacing.xl,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
