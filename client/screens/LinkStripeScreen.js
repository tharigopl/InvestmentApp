import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Button,
  ScrollView,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";


import React from "react";
import { Feather } from "@expo/vector-icons";
import GoalComponent from "../components/GoalComponent";
import { linkStripe } from "../util/stripe";
import { getStripeAccount } from "../util/stripe";
import { getUserLoc } from "../util/auth";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../store/auth-context";
import { StripeContext } from "../store/stripe-context";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { GlobalStyles } from "../constants/styles";

export default function LinkStripeScreen() {
  const [stAccOnBoardingUrl, setStAccOnBoardingUrl] = useState(null);

  const [output, setOutput] = useState(null);
  const [stripeaccount, setStripeAccount] = useState(null);

  const authCtx = useContext(AuthContext);
  const stripeCtx = useContext(StripeContext);
  const token = authCtx.token;
  console.log("Token &&&&&&&", authCtx);
  console.log("Stripe Ctx Account &&&&&&&", stripeCtx);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function linkStripeAcc() {
      try {
        if (authCtx.stripeuserid === undefined) {
          console.log("*********************1");
          // const stripeDash = await linkStripe(token);
          // //setFetchedAccounts(accounts);
          // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!", stripeDash);
          // stripeCtx.setstripeaccount(JSON.stringify(stripeDash));
          // console.log("############################", stripeCtx.stripeaccount);
          // //setStAccOnBoardingUrl(stripeDash.data.accountLink.accountLink.url);

          // const result = await WebBrowser.openBrowserAsync(stripeDash.accountLink.url);

          // console.log("Linkine", Linking.createURL(""));
          // setOutput(result);
        } else {
          console.log("*********************2", authCtx.stripeuserid);
          const stripeDash = await getStripeAccount(
            token,
            authCtx.stripeuserid
          );
          console.log("************************", stripeDash);
          stripeCtx.setstripeaccount(stripeDash);
          setStripeAccount(stripeDash);
        }
      } catch (error) {
        //setError('Could not fetch dashoard!');
      }
    }

    linkStripeAcc();
  }, []);

  return (
    <View
    style={[
      styles.container,
      {
        paddingTop: insets.top,
      },
    ]}
  >
    <ScrollView
      contentContainerStyle={{
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {!stripeaccount ? (
        <View style={{ marginTop: 40 }}>
          <Text style={styles.title}>Stripe Account</Text>
          <Text style={styles.loading}>Loading account details...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Stripe Account Overview</Text>
          <Text style={styles.label}>
            First Name:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.individual?.first_name || "Not provided"}
            </Text>
          </Text>

          <Text style={styles.label}>
            Last Name:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.individual?.last_name || "Not provided"}
            </Text>
          </Text>
          <Text style={styles.label}>
            Account ID:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.id}
            </Text>
          </Text>

          <Text style={styles.label}>
            Email:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.email}
            </Text>
          </Text>

          <Text style={styles.label}>
            Country:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.country}
            </Text>
          </Text>

          <Text style={styles.label}>
            Business Type:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.business_type}
            </Text>
          </Text>

          <Text style={styles.label}>
            Charges Enabled:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.charges_enabled ? "Yes" : "No"}
            </Text>
          </Text>

          <Text style={styles.label}>
            Payouts Enabled:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.payouts_enabled ? "Yes" : "No"}
            </Text>
          </Text>

          <Text style={styles.label}>
            Card Payments:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.capabilities?.card_payments}
            </Text>
          </Text>

          <Text style={styles.label}>
            Transfers:
            <Text style={styles.value}>
              {" "}
              {stripeaccount?.accountLink?.capabilities?.transfers}
            </Text>
          </Text>

          {stripeaccount?.accountLink?.requirements?.currently_due?.length >
            0 && (
            <View style={{ marginTop: 25 }}>
              <Text style={styles.warningTitle}>
                Missing Requirements:
              </Text>

              {stripeaccount.accountLink.requirements.currently_due.map(
                (item) => (
                  <Text key={item} style={styles.warningItem}>
                    • {item}
                  </Text>
                )
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        //paddingHorizontal:20,
        //paddingVertical:35,
         paddingTop: 40,
         paddingBottom: 20,
         paddingLeft: 20,
         paddingRight: 20,
        backgroundColor: GlobalStyles.colors.primary800,
      },
  linkstripescreen: {
    backgroundColor: "#F7F7F7",
    flex: 1,
    padding: 10,
    position: "relative",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  
  label: {
    color: "#ccc",
    marginBottom: 8,
    fontSize: 14,
  },
  
  value: {
    color: "white",
    fontWeight: "600",
  },
  
  loading: {
    color: "white",
    marginTop: 10,
  },
  
  warningTitle: {
    color: "#ffcc00",
    fontWeight: "bold",
    marginBottom: 8,
  },
  
  warningItem: {
    color: "#ffcc00",
    fontSize: 13,
    marginBottom: 4,
  },
});
