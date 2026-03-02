0// client/App.js - FINAL with Logout Button
import { useContext, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLoading from 'expo-app-loading';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from "react-native";

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import WelcomeScreen from './screens/WelcomeScreen';

// Legacy Screens
import Chat from './screens/Chat';
import HomeScreen from './screens/HomeScreen';
import ThaiTripScreen from './screens/ThaiTripScreen';
import TripScreen from './screens/TripScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import ListScreen from './screens/ListScreen';
import LinkStripeScreen from './screens/LinkStripeScreen';
import UserSearchScreen from './screens/UserSearchScreen';
import LinkStripeWebViewScreen from './screens/LinkStripeWebViewScreen';
import AllFriends from './screens/AllFriends';
import AddFriend from './screens/AddFriend';
import ProfileScreen from './screens/ProfileScreen';
import AllParties from './screens/AllParties';
import ManageParty from './screens/ManageParty';
import UserDetails from './screens/UserDetails';
import ManageUser from './screens/ManageUser';
import MultiSelectAddFriend from './screens/MultiSelectAddFriend';
import EditProfileScreen from './screens/EditProfileScreen';

//  NEW Investment Event Screens
import EventFeed from './screens/EventFeed';
import EventDetails from './screens/EventDetails';
import CreateInvestmentEvent from './screens/CreateInvestmentEvent';
import ContributionScreen from './screens/ContributionScreen';
import PublicEventView from './screens/PublicEventView';

//Event Invite Screens
import EventTypeSelectionScreen from './screens/evite/EventTypeSelectionScreen';
import DesignSelectionScreen from './screens/evite/DesignSelectionScreen';
import ManageInvitesScreen from './screens/evite/ManageInvitesScreen';
import CreateEventFlowScreen from './screens/evite/CreateEventFlowScreen';
import GuestContributionScreen from './screens/GuestContributionScreen';
import ContributionSuccessScreen from './screens/ContributionSuccessScreen';

// Contexts & Components
import AuthContextProvider, { AuthContext } from './store/auth-context';
import StripeContextProvider, { StripeContext } from './store/stripe-context';
import FriendsContextProvider from './store/friends-context';
import UsersContextProvider, { UserContext } from './store/user-context';
import IconButton from './components/ui/IconButton';
import { Colors } from './constants/styles';
import { GlobalStyles } from './constants/styles';
import AddFriendScreen from './screens/AddFriendScreen';
import config from './config';


//Stripe
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import ManageEventFunds from './screens/ManageEventFunds';
import PurchaseStocks from './screens/PurchaseStocks';

// Custom Drawer Content
import CustomDrawerContent from './components/CustomDrawerContent';


// ============================================
// ✅ PUBLIC ROUTE HELPERS
// ============================================
function isPublicRoute() {
  if (typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    const shareId = getShareIdFromUrl();
    
    // Only return true if:
    // 1. Path starts with /events/share/
    // 2. ShareId exists and is valid
    const isValid = path.startsWith('/events/share/') && 
                    shareId && 
                    shareId.length >= 6 && 
                    shareId !== 'null' && 
                    shareId !== 'undefined';
    
    console.log('🔍 Public Route Check:', {
      url: window.location.href,
      path: path,
      shareId: shareId,
      isValid: isValid
    });
    
    return isValid;
  }
  return false;
}

function getShareIdFromUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    
    // Match /events/share/{shareId} where shareId is alphanumeric, min 6 chars
    const match = path.match(/^\/events\/share\/([a-zA-Z0-9]{6,})$/);
    return match ? match[1] : null;
  }
  return null;
}


const STRIPE_PUBLISHABLE_KEY = config.STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const BottomTabs = createBottomTabNavigator();

// App Navigation Theme
const AppNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B6B',
    background: '#FFF9F0',
    card: '#FFFFFF',
    text: '#333333',
    border: '#FFE5B4',
    notification: '#4ECDC4',
  },
};

// For React Navigation Web, add linking configuration

const linking = {
  prefixes: ['https://localhost:8081', 'https://yourapp.com', 'http://localhost:19006'],
  config: {
    screens: {
      PublicEventView: 'events/share/:shareId',
      // ... other screens
    },
  },
};

// ============================================
// AUTH STACK (Login/Signup)
// ============================================
function AuthStack() {
  const shareId = getShareIdFromUrl();
  const initialRoute = (isPublicRoute() && shareId) ? 'PublicEventView' : 'Login';
  
  console.log('🎯 AuthStack initialRoute:', initialRoute, 'shareId:', shareId);
  
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      {/* Public Event View */}
      <Stack.Screen 
        name="PublicEventView" 
        component={PublicEventView}
        options={{ title: 'Event Invitation', headerShown: true }}
        initialParams={{ shareId: shareId }}  // Pass actual shareId, not function
      />
      {/* ✅ NEW: Guest Contribution Screens */}
      <Stack.Screen 
        name="GuestContribution" 
        component={GuestContributionScreen}
        options={{ title: 'Contribute', headerShown: true }}
      />
      <Stack.Screen 
        name="ContributionSuccess" 
        component={ContributionSuccessScreen}
        options={{ title: 'Success', headerShown: false }}
      />
      
      {/* Login/Signup */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ============================================
//  NEW: MANAGE FUNDS OVERVIEW (Bottom Tabs)
// ============================================
function ManageFundsOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);
  console.log("Configs ", config.STRIPE_PUBLISHABLE_KEY);
  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { 
          backgroundColor: '#FF6B6B',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        //  LOGOUT BUTTON IN HEADER
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      })}
    >
      {/* ManageEventFunds Tab */}
      <BottomTabs.Screen
        name="ManageEventFunds"
        component={ManageEventFunds}
        options={{
          title: 'Manage Event Funds',
          tabBarLabel: 'ManageEventFunds',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />

      {/* My PurchaseStocks Tab */}
      <BottomTabs.Screen
        name="PurchaseStocks"
        component={PurchaseStocks} // You can replace with a dedicated MyContributions screen
        options={{
          title: 'Purchase Stocks',
          tabBarLabel: 'PurchaseStocks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
//  NEW: INVESTMENT EVENTS OVERVIEW (Bottom Tabs)
// ============================================
function InvestmentEventsOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);
  console.log("Configs ", config.STRIPE_PUBLISHABLE_KEY);
  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: '#FF6B6B' },
        tabBarActiveTintColor: 'white',
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        //  LOGOUT BUTTON IN HEADER
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      })}
    >
      {/* Event Feed Tab */}
      <BottomTabs.Screen
        name="EventFeedTab"
        component={EventFeed}
        options={{
          title: 'Investment Events',
          tabBarLabel: 'Events',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />

      {/* My Contributions Tab */}
      <BottomTabs.Screen
        name="MyContributionsTab"
        component={ContributionScreen} // You can replace with a dedicated MyContributions screen
        options={{
          title: 'My Contributions',
          tabBarLabel: 'Contributions',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />

      {/* Portfolio Tab (Optional - for future) */}
      <BottomTabs.Screen
        name="PortfolioTab"
        component={ProfileScreen} // Replace with Portfolio screen when ready
        options={{
          title: 'Portfolio',
          tabBarLabel: 'Portfolio',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
//  NEW: Add Friends OVERVIEW (Bottom Tabs)
// ============================================
function AddFriendsOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        //  LOGOUT BUTTON IN HEADER
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      })}
    >
      {/* Add Friend Screen */}
      <BottomTabs.Screen
        name="AddFriendScreen"
        component={AddFriendScreen}
        options={{
          title: 'Add Friend',
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />      
    </BottomTabs.Navigator>
  );
}


// ============================================
// TRIPS OVERVIEW (Existing - Bottom Tabs)
// ============================================
function TripsOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#4ECDC4' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        headerRight: ({ tintColor }) => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon="add"
              size={24}
              color={tintColor}
              onPress={() => {
                navigation.navigate('ManageParty');
              }}
            />
            {/*  LOGOUT BUTTON */}
            <IconButton
              icon="exit"
              size={24}
              color={tintColor}
              onPress={logout}
            />
          </View>
        ),
      })}
    >
      <BottomTabs.Screen
        name="BottomTripScreen"
        component={TripScreen}
        options={{
          title: 'Trip',
          tabBarLabel: 'Trip',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="BottomChat"
        component={Chat}
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
// PROFILE OVERVIEW (Existing - Bottom Tabs)
// ============================================
function ProfileOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: '#333',
        tabBarStyle: { backgroundColor: '#FF6B6B' },
        tabBarActiveTintColor: 'white',
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        //  LOGOUT BUTTON IN HEADER
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      })}
    >
      <BottomTabs.Screen
        name="BottomManageUserScreen"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'My Profile',
	  tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="BottomFriendsList"
        component={AllFriends}
        options={{
          title: 'Friends',
          tabBarLabel: 'My Friends',
	  tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="BottomAddFriends"
        component={AddFriendScreen}
        options={{
          title: 'Add Friends',
          tabBarLabel: 'Add Friends',
	  tabBarStyle: {
            backgroundColor: '#FFFFFF',  // White background
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF6B6B',    // Coral for active
          tabBarInactiveTintColor: '#CCCCCC',  // Lighter gray (less harsh)
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add" size={size} color={color} />
          ),
          headerShown: true,
          headerRight: ({ tintColor }) => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={{ paddingRight: 8 }}
                onPressIn={() => console.log("Search")}
                hitSlop={5}
              >
                <Ionicons name="save" size={28} color={"#faf2c4"} />
              </Pressable>
              {/*  LOGOUT BUTTON */}
              <IconButton
                icon="exit"
                size={24}
                color={tintColor}
                onPress={logout}
              />
            </View>
          )
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
// PARTIES OVERVIEW (Existing - Bottom Tabs)
// ============================================
function PartiesOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#A8E6CF' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#A8E6CF',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerLeft: ({ tintColor }) => (
          <IconButton
            icon="menu"
            size={24}
            color={tintColor}
            onPress={() => navigation.getParent()?.openDrawer()}
          />
        ),
        //  LOGOUT BUTTON IN HEADER
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      })}
    >
      <BottomTabs.Screen
        name="BottomAllParties"
        component={AllParties}
        options={{
          title: 'All Parties',
          tabBarLabel: 'All Parties',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="BottomManageParty"
        component={ManageParty}
        options={{
          title: 'Manage Party',
          tabBarLabel: 'Manage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
//  UPDATED: DRAWER NAVIGATOR (Main Menu)
// ============================================
function DrawerNavig(){
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800' },
        sceneContainerStyle: { backgroundColor: '#FFF9F0' },
        drawerStyle: {
          backgroundColor: '#FFF9F0',
          width: 280,
        },
        drawerActiveTintColor: '#FF6B6B',
        drawerInactiveTintColor: '#666666',
        drawerActiveBackgroundColor: '#FFE5B4',
        drawerInactiveBackgroundColor: 'transparent',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          marginLeft: -16,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 4,
          paddingHorizontal: 12,
        },
	//  LOGOUT BUTTON IN ALL DRAWER SCREENS
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      }}
    >
      {/*  NEW: Investment Events - Main Feature */}
      <Drawer.Screen 
        name="InvestmentEvents" 
        component={InvestmentEventsOverview}
        options={{
          title: '💰 Investment Events',
          drawerIcon: () => null,
          headerShown: false, // InvestmentEventsOverview has its own header with logout
        }}
      />
       {/*  NEW: Manage Funds - Main Feature */}
       <Drawer.Screen 
        name="ManageFunds" 
        component={ManageFundsOverview}
        options={{
          title: '💰 Manage Funds',
          drawerIcon: () => null,
          headerShown: false, // 
        }}
      />
      {/*  NEW: Add Friend - Main Feature */}
      <Drawer.Screen 
        name="AddFriends" 
        component={AddFriendsOverview}
        options={{
          title: '👥 Add Friends',
          drawerIcon: () => null,
          headerShown: false, // AddFriendsOverview has its own header with logout
        }}
      />
      {/* Home Screen */}
      <Drawer.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{
          title: '🏠 Home',
          drawerIcon: () => null,
        }}
      />

      {/* Profile */}
      <Drawer.Screen 
        name="ProfileOverviewDrawer" 
        component={ProfileOverview}
        options={{
          title: '👤 Profile',
          drawerIcon: () => null,
          headerShown: false,
        }}
      />
      {/* <Drawer.Screen 
        name="ProfileScreenDirect" 
        component={ProfileScreen}  // ✅ Direct component, no tabs!
        options={{
          title: '👤 My Profile',
          drawerIcon: ({ focused, size, color }) => null,
          headerShown: true,  // ✅ Shows header with back button
          headerStyle: { backgroundColor: '#FF6B6B' },
          headerTintColor: '#333',
          headerTitleStyle: { fontWeight: '800' },
        }}
      /> */}

      {/* Friends */}
      <Drawer.Screen 
        name="FriendsOverviewDrawer" 
        component={AllFriends}
        options={{
          title: '👥 Friends',
          drawerIcon: () => null,
        }}
      />

      {/* Legacy: Trips */}
      <Drawer.Screen 
        name="TripsOverviewDrawer" 
        component={TripsOverview}
        options={{
          title: '✈️ Trips',
          drawerIcon: () => null,
          headerShown: false, // TripsOverview has its own header with logout
        }}
      />

      {/* Welcome Screen (Optional) */}
      {/* <Drawer.Screen 
        name="WelcomeScreen" 
        component={WelcomeScreen}
        options={{
          title: '👋 Welcome',
          drawerIcon: () => null,
        }}
      /> */}
    </Drawer.Navigator>
  );
}


// ============================================
//  UPDATED: AUTHENTICATED STACK (After Login)
// ============================================
function AuthenticatedStack() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    authCtx.logout();
    userCtx.removeUserAccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FF6B6B' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: '#FFF9F0' },
	//  DEFAULT LOGOUT BUTTON FOR ALL STACK SCREENS
        headerRight: ({ tintColor }) => (
          <IconButton
            icon="exit"
            size={24}
            color={tintColor}
            onPress={logout}
          />
        ),
      }}
    >
      {/* Main Drawer */}
      <Stack.Screen
        name="Drawer"
        component={DrawerNavig}
        options={{
          headerShown: false, // Drawer has its own headers
        }}
      />

      {/* ============================================ */}
      {/*  NEW: INVESTMENT EVENT SCREENS */}
      {/* ============================================ */}
      
      {/* Event Details */}
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetails}
        options={{
          title: 'Event Details',
          presentation: 'card',
        }}
      />

      {/* Create Investment Event */}
      <Stack.Screen 
        name="CreateInvestmentEvent" 
        component={CreateInvestmentEvent}
        options={{
          title: 'Create Event',
          presentation: 'card',
        }}
      />

      {/* Contribution Screen */}
      <Stack.Screen 
        name="ContributionScreen" 
        component={ContributionScreen}
        options={{
          title: 'Contribute',
          presentation: 'card',
        }}
      />

      {/* ✅ NEW: Investment Management Screens */}
      <Stack.Screen 
        name="ManageEventFunds" 
        component={ManageEventFunds}
        options={{
          title: 'Manage Funds',
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="PurchaseStocks" 
        component={PurchaseStocks}
        options={{
          title: 'Purchase Stocks',
          presentation: 'card',
        }}
      />

      {/* User Search Screen */}
      <Stack.Screen 
        name="UserSearch" 
        component={UserSearchScreen}
        options={{
          title: 'Search Users',
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />

      {/* ============================================ */}
      {/* EXISTING SCREENS */}
      {/* ============================================ */}

      {/* Overview Screens */}
      <Stack.Screen 
        name="AllPartiesOverview" 
        component={PartiesOverview} 
        options={{ headerShown: false }} // PartiesOverview has its own header with logout
      />
      <Stack.Screen 
        name="AllTripsOverview" 
        component={TripsOverview} 
        options={{ headerShown: false }} // TripsOverview has its own header with logout
      />
      <Stack.Screen 
        name="ProfileOverview" 
        component={ProfileOverview} 
        options={{ headerShown: false }} // ProfileOverview has its own header with logout
      />

      {/* Party Management */}
      <Stack.Screen
        name="ManageParty"
        component={ManageParty}
        options={{
          presentation: 'modal',
          title: 'Manage Party',
        }}
      />
      <Stack.Screen 
        name="AllParties" 
        component={AllParties}
        options={{ title: 'All Parties' }}
      />

      {/* Friend Management */}
      <Stack.Screen 
        name="AllFriends" 
        component={AllFriends}
        options={({ navigation }) => ({
          title: 'Friends',
          headerRight: ({ tintColor }) => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton
                icon="add"
                size={24}
                color={tintColor}
                onPress={() => navigation.navigate('ListScreen')}
              />
              {/*  LOGOUT BUTTON */}
              <IconButton
                icon="exit"
                size={24}
                color={tintColor}
                onPress={logout}
              />
            </View>
          )
        })}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriend}
        options={{ title: 'Add Friend' }}
      />
      <Stack.Screen 
        name="MultiSelectAddFriend" 
        component={MultiSelectAddFriend}
        options={{ title: 'Select Friends' }}
      />
      <Stack.Screen 
        name="ListScreen" 
        component={ListScreen}
        options={({ navigation }) => ({
          title: 'Friend List',
          headerRight: ({ tintColor }) => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton
                icon="save"
                size={24}
                color={tintColor}
                onPress={() => navigation.navigate('AllFriends')}
              />
              {/*  LOGOUT BUTTON */}
              <IconButton
                icon="exit"
                size={24}
                color={tintColor}
                onPress={logout}
              />
            </View>
          )
        })}
      />

      {/* User Management */}
      <Stack.Screen 
        name="ManageUser" 
        component={ManageUser}
        options={{ title: 'Manage Profile' }}
      />
      {/* Profile Screen 
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ 
          title: 'My Profile',
          headerStyle: { backgroundColor: '#FFD93D' },
          headerTintColor: '#333',
        }}
      />*/}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />

      {/* Stripe */}
      <Stack.Screen 
        name="LinkStripeScreen" 
        component={LinkStripeScreen}
        options={{ headerShown: true, title: 'Link Stripe' }}
      />
      <Stack.Screen 
        name="LinkStripeWebViewScreen" 
        component={LinkStripeWebViewScreen}
        options={{ title: 'Stripe Setup' }}
      />

      {/* Legacy */}
      <Stack.Screen 
        name="ThaiTrip" 
        component={ThaiTripScreen}
        options={{ title: 'Thai Trip' }}
      />
      <Stack.Screen 
        name="ChatStack" 
        component={Chat}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="GroupChatScreen" 
        component={GroupChatScreen}
        options={{ title: 'Group Chat' }}
      />
      <Stack.Screen 
        name="EventFeed" 
        component={EventFeed}
        options={{ title: 'Investment Events' }}
      />
      <Stack.Screen 
        name="EventTypeSelection" 
        component={EventTypeSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DesignSelection" 
        component={DesignSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ManageInvites" 
        component={ManageInvitesScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="CreateEventFlow" 
        component={CreateEventFlowScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ============================================
// NAVIGATION CONTAINER
// ============================================
function Navigation() {
  const authCtx = useContext(AuthContext);
  const [initialRouteName, setInitialRouteName] = useState('Login');
  // ✅ Determine initial route based on URL
  useEffect(() => {
    if (isPublicRoute()) {
      console.log("IsPublicRoute");
      setInitialRouteName('PublicEventView');
    } else {
      console.log("LoginRoute");
      setInitialRouteName('Login');
    }
  }, []);

  return (
    <NavigationContainer theme={AppNavigationTheme} linking={linking}>
      {!authCtx.isAuthenticated && <AuthStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
    </NavigationContainer>
  );
}

// ============================================
// ROOT COMPONENT (Handles Auth State)
// ============================================
function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState(true);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    async function fetchToken() {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        authCtx.authenticate(storedToken);
      }
      setIsTryingLogin(false);
    }
    fetchToken();
  }, []);

  useEffect(() => {
    async function fetchUid() {
      const storedUid = await AsyncStorage.getItem('uid');
      if (storedUid) {
        authCtx.addUid(storedUid);
      }
      setIsTryingLogin(false);
    }
    fetchUid();
  }, []);

  if (isTryingLogin) {
    return <AppLoading />;
  }
  return <Navigation />;
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  return (
    <>
    <Elements stripe={stripePromise}>
      <StatusBar style="light" />
      <AuthContextProvider>
        <UsersContextProvider>
          <StripeContextProvider>
            <FriendsContextProvider>
              <Root />
            </FriendsContextProvider>
          </StripeContextProvider>
        </UsersContextProvider>
      </AuthContextProvider>
      </Elements>
    </>
  );
}