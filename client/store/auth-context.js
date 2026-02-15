import AsyncStorage from '@react-native-async-storage/async-storage';

import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext({
  token: '',
  email:'',
  uid:'',
  stripeuserid:'',
  isAuthenticated: false,
  authenticate: (token) => {},
  logout: () => {},
  saveStripeUserId: (stripeuserid) => {},
  removeStripeUserId: () => {},
  addUid: (uid) => {},
  removeUid: () => {},
});

function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState();
  const [stripeUserId, setStripeUserId] = useState();
  const [authUid, setAuthUid] = useState();

  function authenticate(token) {
    setAuthToken(token);
    AsyncStorage.setItem('token', token);
  }

  function logout() {
    setAuthToken(null);
    AsyncStorage.removeItem('token');
    setAuthUid(null);
    AsyncStorage.removeItem('uid');
  }

  function addUid(uid) {
    setAuthUid(uid);
    AsyncStorage.setItem('uid', uid);
  }

  function removeUid() {
    setAuthUid(null);
    AsyncStorage.removeItem('uid');
  }


  function removeStripeUserId(){
    setStripeUserId(null);
    AsyncStorage.removeItem('stripeuserid');
  }

  function saveStripeUserId(stripeuserid){
    console.log("Save Stripe user id ", stripeuserid);
    setStripeUserId(stripeuserid);
    AsyncStorage.setItem('stripeuserid');
  }

  const value = {
    token: authToken,
    uid:authUid,
    stripeuserid:stripeUserId,
    isAuthenticated: !!authToken,
    authenticate: authenticate,
    logout: logout,
    saveStripeUserId:saveStripeUserId,
    removeStripeUserId:removeStripeUserId,
    addUid:addUid,
    removeUid:removeUid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
