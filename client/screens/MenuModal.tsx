import React from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/authContext";

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export default function MenuModal({ visible, onClose, onSignIn, onCreateAccount }: MenuModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView style={[styles.menu, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.header}>
            <ThemedText type="h3">Menu</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.menuItems}>
            {user ? (
              <>
                <View style={[styles.userInfo, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={styles.avatar}>
                    <Feather name="user" size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.userDetails}>
                    <ThemedText type="body" style={styles.userName}>
                      {user.displayName}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {user.email}
                    </ThemedText>
                  </View>
                </View>

                <Pressable style={styles.menuItem} onPress={handleSignOut}>
                  <Feather name="log-out" size={20} color={theme.text} />
                  <ThemedText type="body" style={styles.menuItemText}>
                    Sign Out
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.menuItem} onPress={() => { onClose(); onSignIn(); }}>
                  <Feather name="log-in" size={20} color={theme.text} />
                  <ThemedText type="body" style={styles.menuItemText}>
                    Sign In
                  </ThemedText>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => { onClose(); onCreateAccount(); }}>
                  <Feather name="user-plus" size={20} color={theme.text} />
                  <ThemedText type="body" style={styles.menuItemText}>
                    Create Account
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menu: {
    width: 280,
    height: "100%",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItems: {
    flex: 1,
    gap: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
  },
});
