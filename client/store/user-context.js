import AsyncStorage from '@react-native-async-storage/async-storage';

import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext({
  useraccount: {},
  setuseraccount: (useraccount) => {},
  removeuseraccount: () => {},
});

function UserContextProvider({ children }) {
  
  const [userAccount, setUserAccount] = useState();

  function setuseraccount(useraccount) {
    console.log("Settoing user ctx account in store ", useraccount);
    
    setUserAccount(useraccount.user);
    
    AsyncStorage.setItem('useraccount', useraccount);
    console.log("Settoing user ctx account in store 12", userAccount);
  }

  function removeuseraccount() {
    console.log("Remove user Account ");
    setUserAccount(null);
    console.log("Remove user Account 1");
    AsyncStorage.removeItem('useraccount');
  }

  const value = {
    useraccount: userAccount,
    setuseraccount: setuseraccount,
    removeuseraccount: removeuseraccount,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
