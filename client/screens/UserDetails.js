
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../store/user-context';
import { getUserDetails } from '../util/user';
import { AuthContext } from '../store/auth-context';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import ErrorOverlay from '../components/ui/ErrorOverlay';
import { GlobalStyles } from '../constants/styles';
import {
    Animated,
    Image,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
  } from 'react-native'

import { Card, Icon } from 'react-native-elements'
import {
  FlatList,
  Linking,
} from 'react-native'


function UserDetails() {
  const userCtx = useContext(UserContext);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  //const [fetchedAccounts, setFetchedAccounts] = useState([]);


  const authCtx = useContext(AuthContext);
  const token = authCtx.token;
  const uid = authCtx.uid;
  console.log("Inside Get User Details token ", token, userCtx);
  setIsFetching(false);
  
//   useEffect(() => {
//     async function getUserDetail() {
//       setIsFetching(true);
//       try {
//         console.log("Inside Get User Details " + token);
//         const user = await getUserDetails(token, uid);
//         //setFetchedAccounts(accounts);
//         console.log("Inside  Get User Details 99999 ", user);
//         userCtx.setUserAccount(user);
//         console.log("Inside  Get User Details Auth  ", userCtx);
//       } catch (error) {
//         setError('Could not fetch user 1 details!');
//       }
//       setIsFetching(false);
//     }

//     getUserDetail();
//   }, []);

  if (error && !isFetching) {
    return <ErrorOverlay message={error} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }
  console.log("Inside  Get User Details Auth  ", userCtx);
  const userDetail = userCtx.userAccount;
  //const fetchedAccs = fetchedAccounts;
  

  return (
    <ScrollView style={styles.scroll}>
        <View style={styles.cardContainer}>
            <View style={styles.emailContainer}>
              <TextInput value={userDetail.email} placeholder = "Add Email">                
              </TextInput>            
            </View>
            <View>
              <TextInput placeholder="Firstname">
                {userDetail.firstname}
              </TextInput>
            </View>
            <View>
              <TextInput placeholder="Lastname">
                {userDetail.lastname}
              </TextInput>
            </View>
            <View>
              <TextInput placeholder="Middlename">
                {userDetail.middlename}
              </TextInput>
            </View>
        </View>
      </ScrollView>
  );
}

export default UserDetails;

const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: '#FFF',
      borderWidth: 0,
      flex: 1,
      margin: 0,
      padding: 0,
    },
    container: {
      flex: 1,
    },
    emailContainer: {
      backgroundColor: '#FFF',
      flex: 1,
      paddingTop: 30,
    },
    headerBackgroundImage: {
      paddingBottom: 20,
      paddingTop: 45,
    },
    headerContainer: {},
    headerColumn: {
      backgroundColor: 'transparent',
      ...Platform.select({
        ios: {
          alignItems: 'center',
          elevation: 1,
          marginTop: -1,
        },
        android: {
          alignItems: 'center',
        },
      }),
    },
    placeIcon: {
      color: 'white',
      fontSize: 26,
    },
    scroll: {
      backgroundColor: '#FFF',
    },
    telContainer: {
      backgroundColor: '#FFF',
      flex: 1,
      paddingTop: 30,
    },
    userAddressRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    userCityRow: {
      backgroundColor: 'transparent',
    },
    userCityText: {
      color: '#A5A5A5',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    userImage: {
      borderColor: '#FFF',
      borderRadius: 85,
      borderWidth: 3,
      height: 170,
      marginBottom: 15,
      width: 170,
    },
    userNameText: {
      color: '#FFF',
      fontSize: 22,
      fontWeight: 'bold',
      paddingBottom: 8,
      textAlign: 'center',
    },
    textBase: {
        color: GlobalStyles.colors.primary800,
    },
    email: {
        fontSize: 16,
        marginBottom: 4,
        fontWeight: 'bold',
    },
  })