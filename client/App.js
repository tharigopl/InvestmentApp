import { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLoading from 'expo-app-loading';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import Chat from './screens/Chat';
import { Colors } from './constants/styles';
import AuthContextProvider, { AuthContext } from './store/auth-context';
import IconButton from './components/ui/IconButton';
import HomeScreen from './screens/HomeScreen';
import ThaiTripScreen from './screens/ThaiTripScreen';
import TripScreen from './screens/TripScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import ListScreen from './screens/ListScreen';
import LinkStripeScreen from './screens/LinkStripeScreen';
import AllFriends from './screens/AllFriends';
import AddFriend from './screens/AddFriend'
import LinkStripeWebViewScreen from './screens/LinkStripeWebViewScreen';
import StripeContextProvider, { StripeContext } from './store/stripe-context';
import FriendsContextProvider from './store/friends-context';
import ProfileScreen from './screens/ProfileScreen';
import AllParties from './screens/AllParties';
import ManageParty from './screens/ManageParty';
import UserDetails from './screens/UserDetails';
import UsersContextProvider, { UserContext } from './store/user-context';
import ManageUser from './screens/ManageUser';
import { GlobalStyles } from './constants/styles';
import { Ionicons } from '@expo/vector-icons';
import MultiSelectAddFriend from './screens/MultiSelectAddFriend';
import { View, Text, Pressable, StyleSheet } from "react-native";
import RootNavigator from "./navigation/RootNavigator";


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const BottomTabs = createBottomTabNavigator();


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


function DrawerNavig(){
  const authCtx = useContext(AuthContext);
  
  return(
    <Drawer.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#351401' },
      headerTintColor: 'white',
      sceneContainerStyle: { backgroundColor: '#3f2f25' },
      drawerContentStyle: { backgroundColor: '#351401' },
      drawerInactiveTintColor: 'white',
      drawerActiveTintColor: '#351401',
      drawerActiveBackgroundColor: '#e4baa1',
    }}
  >
      <Drawer.Screen name="HomeScreen" component={HomeScreen} 
        options = {{
          drawerIcon: ({focused, size}) => (
            <IconButton
              icon="exit"
              size={24}
              onPress={authCtx.logout}
            />
         )
        }}
      />
      <Drawer.Screen name="WelcomeScreen" component={WelcomeScreen} />
      {/* <Drawer.Screen name="Chat" component={Chat} />
      <Drawer.Screen name="ThaiTrip" component={ThaiTripScreen} /> */}
    </Drawer.Navigator>
    );
}

function TripsOverview() {
  return (
    
    <BottomTabs.Navigator
    screenOptions={({ navigation }) => ({
      headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      headerTintColor: 'white',
      tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      tabBarActiveTintColor: GlobalStyles.colors.accent500,
      headerRight: ({ tintColor }) => (
        <IconButton
          icon="add"
          size={24}
          color={tintColor}
          onPress={() => {
            navigation.navigate('ManageParty');
          }}
        />
      ),
    })}
  >

       <BottomTabs.Screen
        name="BottomTripScreen"
        component={TripScreen}
        options={{
          title: 'Trip',
          tabBarLabel: 'TripTabBarLabel',
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
          tabBarLabel: 'Chatstabbarlabel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hourglass" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

function ProfileOverview() {
  return (
    
    <BottomTabs.Navigator
    screenOptions={({ navigation }) => ({
      headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      headerTintColor: 'white',
      tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      tabBarActiveTintColor: GlobalStyles.colors.accent500,
      // headerRight: ({ tintColor }) => (
      //   <IconButton
      //     icon="add"
      //     size={24}
      //     color={tintColor}
      //     onPress={() => {
      //       navigation.navigate('ManageUser');
      //     }}
      //   />
      // ),
    })}
  >

       <BottomTabs.Screen
        name="BottomManageUserScreen"
        component={ManageUser}
        options={{
          title: 'Profile',
          tabBarLabel: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
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
            <Ionicons name="hourglass" size={size} color={color} />
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
            <Ionicons name="hourglass" size={size} color={color} />
          ),
          headerShown: true,
          headerRight: () => (
            <Pressable
              style={{ paddingRight: 16 }}
              onPressIn={() => console.log("Search")}
              hitslop={5}
            >
              <Ionicons name="save" size={28} color={"#faf2c4"} />
            </Pressable>
          )
        }}
      />
    </BottomTabs.Navigator>
  );
}

function PartiesOverview() {
  return (
    
    <BottomTabs.Navigator
    screenOptions={({ navigation }) => ({
      headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      headerTintColor: 'white',
      tabBarStyle: { backgroundColor: GlobalStyles.colors.primary500 },
      tabBarActiveTintColor: GlobalStyles.colors.accent500,
      // headerRight: ({ tintColor }) => (
      //   <IconButton
      //     icon="add"
      //     size={24}
      //     color={tintColor}
      //     onPress={() => {
      //       navigation.navigate('ManageParty');
      //     }}
      //   />
      // ),
    })}
  >

       <BottomTabs.Screen
        name="AllParties"
        component={AllParties}
        options={{
          title: 'All Parties',
          tabBarLabel: 'All Parties',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="ManageParties"
        component={ManageParty}
        options={{
          title: 'Manage Party',
          tabBarLabel: 'Manage Parties',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hourglass" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

function StackNavig(){
  const authCtx = useContext(AuthContext);
  return(
  <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen name="HomeScreen" component={HomeScreen} 
        options = {{
          
        //   headerRight: ({focused, size}) => (
        //     <IconButton
        //       icon="exit"
        //       size={24}
        //       onPress={authCtx.logout}
        //     />
        //  )
        }}
      />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="ThaiTrip" component={ThaiTripScreen} />
      <Stack.Screen name="GroupChatScreen" component={GroupChatScreen} />
      <Stack.Screen name="LinkStripeScreen" component={LinkStripeScreen} />
      <Stack.Screen name="LinkStripeWebViewScreen" component={LinkStripeWebViewScreen} />
      <Stack.Screen name="AllPartiesOverview" component={PartiesOverview} options={{headerShown:true}}/>
      <Stack.Screen name="AllTripOverview" component={TripOverview} options={{headerShown:false}}/>
      <Stack.Screen name="AllFriends" component={AllFriends} 
        options={({ navigation, route }) => ({          
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: ({focused, size}) => (
                <IconButton
                  icon="add"
                  size={24}
                  onPress={() => {
                    navigation.navigate('ListScreen');
                  }}
                />
              )
        })}        
      />
      <Stack.Screen name="ListScreen" component={ListScreen} 
        options={({ navigation, route }) => ({          
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: ({focused, size}) => (
                <IconButton
                  icon="save"
                  size={24}
                  onPress={() => {
                    navigation.navigate('AllFriends');
                  }}
                />
              )
        })}        
      />
      <Stack.Screen name="AddFriend" component={AddFriend} />
      {/* <Stack.Screen name="Profile" component={UserDetails} /> */}
      <Stack.Screen name="AllParties" component={AllParties} />
      <Stack.Screen name="ManageParty" component={ManageParty} />
      <Stack.Screen name="ManageUser" component={ManageUser} />
      <Stack.Screen name="ChatStack" component={Chat} />
      <Stack.Screen name="ThaiTrip" component={ThaiTripScreen} />
    </Stack.Navigator>
    );
}

function AuthenticatedStack() {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);

  function logout(){
    console.log("Log out ");
    authCtx.logout();
    userCtx.removeuseraccount();
    stripeCtx.removestripeaccount();
    console.log("Contexts 1", authCtx, userCtx);
  }
  return (
    // <Drawer.Navigator screenOptions={{ headerStyle: { backgroundColor: 'papayawhip' }, headerRight: ({tintColor}) => <IconButton icon="exit" color={tintColor} size={24} onPress={logout}/>}}>
    //   {/* <Stack.Screen name="TourDeThailand" component={DrawerNavig} 
    //     options={{
    //       headerRight: ({tintColor}) => <IconButton icon="exit" color={tintColor} size={24} onPress={authCtx.logout}/>,
    //     }}
    //   /> */}
    //   <Drawer.Screen name="Home" component={StackNavig} /> 
    //   <Drawer.Screen name="Chat1" component={Chat} />
    //   <Drawer.Screen name="ThaiTrip" component={ThaiTripScreen} />
    //   {/* <Drawer.Screen name="Profile" component={UserDetails} /> */}
    // </Drawer.Navigator> 
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#351401' },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: '#3f2f25' },
      }}
    >
      <Stack.Screen
            name="Drawer"
            component={DrawerNavig}
            options={{
              headerRight: ({tintColor}) => <IconButton icon="exit" color={tintColor} size={24} onPress={authCtx.logout}/>,
            }}
          />                
      
      <Stack.Screen name="AllPartiesOverview" component={PartiesOverview} options={{headerShown:true}}/>
      <Stack.Screen name="AllTripsOverview" component={TripsOverview} options={{headerShown:true}}/>
      <Stack.Screen name="ProfileOverview" component={ProfileOverview} options={{headerShown:true}}/>
      <Stack.Screen
        name="ManageParty"
        component={ManageParty}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="LinkStripeScreen" component={LinkStripeScreen} 
       options={{headerShown:true}}
      />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} 
       options={{headerShown:false}}
      />
      <Stack.Screen name="ManageUser" component={ManageUser} />
      <Stack.Screen name="AddFriend" component={AddFriend} />
      <Stack.Screen name="MultiSelectAddFriend" component={MultiSelectAddFriend} />
      {/* <Stack.Screen name="Profile" component={UserDetails} /> */}
      <Stack.Screen name="AllParties" component={AllParties} />
      <Stack.Screen name="AllFriends" component={AllFriends} 
        options={({ navigation, route }) => ({          
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: ({focused, size}) => (
                <IconButton
                  icon="add"
                  size={24}
                  onPress={() => {
                    navigation.navigate('ListScreen');
                  }}
                />
              )
        })}        
      />
      <Stack.Screen name="ThaiTrip" component={ThaiTripScreen} />
      <Stack.Screen name="ChatStack" component={Chat} />
      <Stack.Screen name="ListScreen" component={ListScreen} 
        options={({ navigation, route }) => ({          
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: ({focused, size}) => (
                <IconButton
                  icon="save"
                  size={24}
                  onPress={() => {
                    navigation.navigate('AllFriends');
                  }}
                />
              )
        })}        
      />
    </Stack.Navigator>
  );   
}
function Navigation() {
  const authCtx = useContext(AuthContext);
  return (
    <NavigationContainer>
      {!authCtx.isAuthenticated && <AuthStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
    </NavigationContainer>
  );
}
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

export default function App() {
  return <RootNavigator />;
}

// export default function App1() {
  
//   return (
//     <>
//       <StatusBar style="light" />
//       <AuthContextProvider>
//         <UsersContextProvider>
//           <StripeContextProvider>
//             <FriendsContextProvider>
//               <Root />
//               </FriendsContextProvider>
//           </StripeContextProvider>
//         </UsersContextProvider>
//       </AuthContextProvider>
//     </>
//   );
// }
