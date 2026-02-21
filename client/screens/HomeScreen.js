import { FlatList, View, Text } from 'react-native';
import HomeGridTile from '../components/HomeGridTile';
import axios from 'axios';

import { HOMECATEGORIES } from '../data/dummy-data';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../store/auth-context';
import { StripeContext } from '../store/stripe-context';
import { fetchUserDetails } from '../util/http';
import { linkStripe } from '../util/stripe';
import { getStripeAccount } from '../util/stripe';
import { getUserDetails } from '../util/user';
import { getUserLoc } from '../util/auth';
import { UserContext } from '../store/user-context'; 
import * as WebBrowser from 'expo-web-browser';


function HomeScreen({ navigation }) {
  console.log("Home Screen")
    const [fetchedMessage, setFetchedMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState();
    const stripeCtx = useContext(StripeContext);

    const authCtx = useContext(AuthContext);
    const usersCtx = useContext(UserContext);
    const token = authCtx.token;
    const uid = authCtx.uid;

    const [editedUserId, setEditedUserId] = useState("");
    const [selectedUser, setSelectedUser] = useState([]);
    const [userLoc, setUserLoc] = useState("");
    console.log("Home Screen Token ", token, uid);

    useEffect(() => {
      async function getUserLocation() {
        try {
          console.log("Home Screen Location");
          const location = await getUserLoc();
          console.log(location.data);
          setUserLoc(location.data.country);
        } catch (error) {
          //setError('Could not fetch dashoard!');
        }
      }
  
      getUserLocation();
    }, []);

    useEffect(() => {
      async function getUserDetail() {
        setIsFetching(true);
        try {
          console.log("Inside Get User Details " + token);
          const user = await getUserDetails(token, uid);
          //setFetchedAccounts(accounts);
          console.log("Inside  Get User Details 99999 ", user);
          usersCtx.setUserAccount(user);
          console.log("Inside  Get User Details Auth  ", usersCtx);
        } catch (error) {
          setError('Could not fetch user 1 details!');
        }
        setIsFetching(false);
      }
  
      getUserDetail();
    }, []);
  

  function renderCategoryItem(itemData) {
    async function pressHandler() {

        if(itemData.item.id === 'h2'){
            navigation.navigate('ProfileOverview', {
                token:token,
            });
        }
        else if(itemData.item.id === 'h3'){
          navigation.navigate('AllFriends', {
              token:token,
          });          
        }
        else if(itemData.item.id === 'h1'){
          navigation.navigate('AllTripsOverview', {
              editedUserId:editedUserId,
              editedUser:selectedUser,
              token:token,
          });          
        }
        else if(itemData.item.id === 'h8'){
          console.log('WWWWWWWWWWWWWWWWWWWw');
          

          navigation.navigate('MultiSelectAddFriend');          
        }
        else if(itemData.item.id === 'h4'){ 
          navigation.navigate('AllPartiesOverview', {
            token:token,
          });          
        }
        else if(itemData.item.id === 'h5'){ 
          navigation.navigate('ManageUser', {
            token:token,
          });          
        }
        else if(itemData.item.id === 'h6'){ 
          console.log('QQQQQQQQQQQQ');
          await linkStripeAcc();

          navigation.navigate('LinkStripeScreen', {
            token:token,
          });          
        }

    }

    async function linkStripeAcc() {
      try {
        console.log("Auth Context Home Screen", authCtx);
          if(authCtx.stripeuserid === undefined){
              const stripeDash = await linkStripe(token, userLoc);
              //setFetchedAccounts(accounts);
              console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!", stripeDash.account);
              //stripeCtx.setstripeaccount(JSON.stringify(stripeDash.account));
              stripeCtx.setstripeaccount(stripeDash.account);
              console.log("############################ $$ 4444 Changed", stripeCtx);
              //setStAccOnBoardingUrl(stripeDash.data.accountLink.accountLink.url);
              console.log("#######@#@#@#@#############12", stripeDash.account.id);
              authCtx.saveStripeUserId(stripeDash.account.id);
              console.log("############################11", stripeCtx);
              const result = await WebBrowser.openBrowserAsync(stripeDash.accountLink.url);
          
              
              setOutput(result);
          }else{
              // console.log("*********************2",authCtx.stripeuserid);
              // const stripeDash = await getStripeAccount(authCtx.stripeuserid);
              // console.log("************************",stripeDash);
              // stripeCtx.setstripeaccount(stripeDash);
          }                    


      } catch (error) {
          //setError('Could not fetch dashoard!');
      }
  }

    return (
      <HomeGridTile
        title={itemData.item.title}
        color={itemData.item.color}
        onPress={pressHandler}
      />
    );
  }

  return (
    <View>
        <Text>{fetchedMessage}</Text>
        <FlatList
        data={HOMECATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        numColumns={2}
        />
    </View>
  );
}

export default HomeScreen;
