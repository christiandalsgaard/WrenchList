import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import ExploreScreen from "@/screens/ExploreScreen";
import ListingsScreen from "@/screens/ListingsScreen";
import ListingDetailScreen from "@/screens/ListingDetailScreen";

export type ExploreStackParamList = {
  Explore: undefined;
  Listings: { categoryId: string; categoryName: string };
  ListingDetail: { listingId: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Listings"
        component={ListingsScreen}
        options={({ route }) => ({
          headerTitle: route.params.categoryName,
        })}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}
