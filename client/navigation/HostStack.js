import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/host/HomeScreen";
import CreateEventScreen from "../screens/host/CreateEventScreen";
import EventCreatedScreen from "../screens/host/EventCreatedScreen";
import CreateInvestmentEvent from "../screens/CreateInvestmentEvent";

const Stack = createNativeStackNavigator();

export default function HostStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EventCreated" component={EventCreatedScreen} />
      <Stack.Screen name="CreateEvent" component={CreateInvestmentEvent} />
    </Stack.Navigator>
  );
}