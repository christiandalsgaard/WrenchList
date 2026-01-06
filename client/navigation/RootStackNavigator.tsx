import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import FilterModal from "@/screens/FilterModal";
import ListingDetailScreen from "@/screens/ListingDetailScreen";
import SignInScreen from "@/screens/SignInScreen";
import CreateAccountScreen from "@/screens/CreateAccountScreen";
import CreateListingScreen from "@/screens/CreateListingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  FilterModal: { categoryId: string };
  GlobalListingDetail: { listingId: string };
  SignIn: undefined;
  CreateAccount: undefined;
  CreateListing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FilterModal"
        component={FilterModal}
        options={{
          presentation: "modal",
          headerTitle: "Filters",
        }}
      />
      <Stack.Screen
        name="GlobalListingDetail"
        component={ListingDetailScreen}
        options={{
          headerTitle: "Listing Details",
        }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          presentation: "modal",
          headerTitle: "Sign In",
        }}
      />
      <Stack.Screen
        name="CreateAccount"
        component={CreateAccountScreen}
        options={{
          presentation: "modal",
          headerTitle: "Create Account",
        }}
      />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          presentation: "modal",
          headerTitle: "Create Listing",
        }}
      />
    </Stack.Navigator>
  );
}
