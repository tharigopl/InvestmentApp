import AsyncStorage from '@react-native-async-storage/async-storage';

import { createContext, useEffect, useState } from 'react';

export const StripeContext = createContext({
  stripeaccount: {},
  setstripeaccount: (stripeaccount) => {},
  removestripeaccount: () => {},
});

function StripeContextProvider({ children }) {
  const [stripeAccount, setStripeAccount] = useState();

  function setstripeaccount(stripeaccount) {
    console.log("Settoing stripe ctx account in store ", stripeaccount);
    setStripeAccount(stripeaccount);
    console.log("Settoing stripe ctx account in store 1", stripeAccount);
    AsyncStorage.setItem('stripeaccount', stripeaccount);
  }

  function removestripeaccount() {
    setStripeAccount(null);
    AsyncStorage.removeItem('stripeaccount');
  }

  const value = {
    stripeaccount: stripeAccount,
    setstripeaccount: setstripeaccount,
    removestripeaccount: removestripeaccount,
  };

  return <StripeContext.Provider value={value}>{children}</StripeContext.Provider>;
}

export default StripeContextProvider;
