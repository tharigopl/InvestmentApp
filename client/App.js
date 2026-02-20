0// client/App.js - FINAL with Logout Button
import { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

//  NEW Investment Event Screens
import EventFeed from './screens/EventFeed';
import EventDetails from './screens/EventDetails';
import CreateInvestmentEvent from './screens/CreateInvestmentEvent';
import ContributionScreen from './screens/ContributionScreen';

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

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const BottomTabs = createBottomTabNavigator();


const STRIPE_PUBLISHABLE_KEY = config.STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);


// ============================================
// AUTH STACK (Login/Signup)
// ============================================
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
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
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        tabBarActiveTintColor: GlobalStyles.colors.accent500,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />

      {/* My Contributions Tab */}
      <BottomTabs.Screen
        name="MyContributionsTab"
        component={AllParties} // You can replace with a dedicated MyContributions screen
        options={{
          title: 'My Contributions',
          tabBarLabel: 'Contributions',
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

// ============================================
//  NEW: INVESTMENT EVENTS OVERVIEW (Bottom Tabs)
// ============================================
function AddFriendsOverview() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        tabBarActiveTintColor: GlobalStyles.colors.accent500,
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
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        tabBarActiveTintColor: GlobalStyles.colors.accent500,
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
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        tabBarActiveTintColor: GlobalStyles.colors.accent500,
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
        component={ManageUser}
        options={{
          title: 'Profile',
          tabBarLabel: 'My Profile',
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="BottomAddFriends"
        component={MultiSelectAddFriend}
        options={{
          title: 'Add Friends',
          tabBarLabel: 'Add Friends',
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
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <BottomTabs.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        tabBarActiveTintColor: GlobalStyles.colors.accent500,
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
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }
  
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        sceneContainerStyle: { backgroundColor: GlobalStyles.colors.gray50 },
        drawerContentStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        drawerInactiveTintColor: 'white',
        drawerActiveTintColor: GlobalStyles.colors.primary500,
        drawerActiveBackgroundColor: GlobalStyles.colors.accent500,
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
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
          headerShown: false, // InvestmentEventsOverview has its own header with logout
        }}
      />
      {/*  NEW: Add Friend - Main Feature */}
      <Drawer.Screen 
        name="AddFriends" 
        component={AddFriendsOverview}
        options={{
          title: '💰 Add Friends',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
          headerShown: false, // AddFriendsOverview has its own header with logout
        }}
      />
      {/* Home Screen */}
      <Drawer.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Drawer.Screen 
        name="ProfileOverviewDrawer" 
        component={ProfileOverview}
        options={{
          title: 'Profile',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerShown: false, // ProfileOverview has its own header with logout
        }}
      />

      {/* Friends */}
      <Drawer.Screen 
        name="FriendsOverviewDrawer" 
        component={AllFriends}
        options={{
          title: 'Friends',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Legacy: Trips */}
      <Drawer.Screen 
        name="TripsOverviewDrawer" 
        component={TripsOverview}
        options={{
          title: 'Trips',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
          headerShown: false, // TripsOverview has its own header with logout
        }}
      />

      {/* Welcome Screen (Optional) */}
      <Drawer.Screen 
        name="WelcomeScreen" 
        component={WelcomeScreen}
        options={{
          title: 'Welcome',
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons name="hand-right" size={size} color={color} />
          ),
        }}
      />
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
    console.log("Logging out...");
    authCtx.logout();
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: GlobalStyles.colors.gray50 },
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
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
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
    </Stack.Navigator>
  );
}

// ============================================
// NAVIGATION CONTAINER
// ============================================
function Navigation() {
  const authCtx = useContext(AuthContext);
  return (
    <NavigationContainer>
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