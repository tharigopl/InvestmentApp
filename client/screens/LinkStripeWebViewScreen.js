import { SafeAreaView, StyleSheet, Text, View, FlatList, Pressable, Button} from 'react-native';
import React from 'react';
import { Feather } from "@expo/vector-icons";
import GoalComponent from '../components/GoalComponent';
import { linkStripe,  } from '../util/stripe';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../store/auth-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';


export default function LinkStripeWebViewScreen() {

    const [stAccOnBoardingUrl, setStAccOnBoardingUrl] = useState(null);

    const [output, setOutput] = useState(null);
    const [redirectData, setRedirectData] = useState(null);
    const [subscriber, setSubscriber] = useState(null);

    const authCtx = useContext(AuthContext);
    const token = authCtx.token;
    console.log("Token &&&&&&&", token);
   
      useEffect(() => {
            console.log("Stripe Dashboard UseEffect");
            async function linkStripeAcc() {
                try {
                const stripeDash = await linkStripe(token);
                //setFetchedAccounts(accounts);
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!", stripeDash);
                setStAccOnBoardingUrl(stripeDash.accountLink.url);                

                } catch (error) {
                    //setError('Could not fetch dashoard!');
                }
            }

            linkStripeAcc();
        }, []);

    

  return (
    <SafeAreaView style={styles.linkstripewebviewscreen}>
    <WebView
        source={{
          uri: stAccOnBoardingUrl,
        }}
        style={{marginTop: 20}}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    linkstripewebviewscreen: {
        backgroundColor: "#F7F7F7",
        flex: 1,
        padding: 10,
        position: "relative",
    },
})