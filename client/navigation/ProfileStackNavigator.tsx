import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";

// Screens within the Profile tab
import ProfileScreen from "@/screens/ProfileScreen";
import BookingHistoryScreen from "@/screens/BookingHistoryScreen";
import SavedListingsScreen from "@/screens/SavedListingsScreen";
import PaymentMethodsScreen from "@/screens/PaymentMethodsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import LocationPreferencesScreen from "@/screens/LocationPreferencesScreen";
import HelpSupportScreen from "@/screens/HelpSupportScreen";
import TermsOfServiceScreen from "@/screens/TermsOfServiceScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  BookingHistory: undefined;
  SavedListings: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  LocationPreferences: undefined;
  HelpSupport: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ headerTitle: "Booking History" }}
      />
      <Stack.Screen
        name="SavedListings"
        component={SavedListingsScreen}
        options={{ headerTitle: "Saved Listings" }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ headerTitle: "Payment Methods" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: "Notifications" }}
      />
      <Stack.Screen
        name="LocationPreferences"
        component={LocationPreferencesScreen}
        options={{ headerTitle: "Location" }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerTitle: "Help & Support" }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ headerTitle: "Terms of Service" }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerTitle: "Privacy Policy" }}
      />
    </Stack.Navigator>
  );
}
