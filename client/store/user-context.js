import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext({
  userAccount: {},
  setUserAccount: (userAccount) => {},
  removeUserAccount: () => {},
});

function UserContextProvider({ children }) {
  
  const [userAccount, setUserAccountState] = useState(null);

  function setUserAccount(userData) {
    console.log("Setting user account:", userData);
    
    // Handle both formats for compatibility
    // If data has .user property, use that, otherwise use data directly
    const data = userData?.user || userData;
    
    setUserAccountState(data);
    AsyncStorage.setItem('userAccount', JSON.stringify(data));
    
    console.log("User account set successfully");
  }

  function removeUserAccount() {
    console.log("Removing user account");
    setUserAccountState(null);
    AsyncStorage.removeItem('userAccount');
  }
  
  // Load user account from AsyncStorage on mount
  useEffect(() => {
    const loadUserAccount = async () => {
      try {
        const storedAccount = await AsyncStorage.getItem('userAccount');
        if (storedAccount) {
          const parsedAccount = JSON.parse(storedAccount);
          console.log("✅ Loaded user account from storage:", parsedAccount.fname, parsedAccount.email);
          setUserAccountState(parsedAccount);
        } else {
          console.log("No stored user account found");
        }
      } catch (error) {
        console.error("❌ Error loading user account:", error);
      }
    };
    
    loadUserAccount();
  }, []);

  const value = {
    userAccount: userAccount,
    setUserAccount: setUserAccount,
    removeUserAccount: removeUserAccount,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;