// Frontend Configuration
// This file handles environment-specific configuration

const ENV = {
    development: {
      API_URL: 'http://localhost:5000/api',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_51NLhI0FQAGzTwM7MLqh8Ye1ctt2a39svtyXB7yCTcgq5TqfW5NUJpPRSMugOxzuFPFsI3VFUqNye37ntZYXPLFsq00yPWoMwlU',
      WS_URL: 'http://localhost:5000',
    },
    staging: {
      API_URL: 'https://staging-api.investmentapp.com/api',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_xxxxxxxxxxxxxxxxxxxxx',
      WS_URL: 'https://staging-api.investmentapp.com',
    },
    production: {
      API_URL: 'https://api.investmentapp.com/api',
      STRIPE_PUBLISHABLE_KEY: 'pk_live_xxxxxxxxxxxxxxxxxxxxx',
      WS_URL: 'https://api.investmentapp.com',
    },
  };
  
  // Detect environment
  // In React Native/Expo, __DEV__ is a global boolean
  const getEnvironment = () => {
    if (typeof __DEV__ !== 'undefined') {
      return __DEV__ ? 'development' : 'production';
    }
    // Fallback for web
    return process.env.NODE_ENV || 'development';
  };
  
  const currentEnv = getEnvironment();
  
  // Export configuration
  const config = {
    ...ENV[currentEnv],
    ENV: currentEnv,
    IS_DEV: currentEnv === 'development',
    IS_PROD: currentEnv === 'production',
  };
  
  export default config;
  
  // Alternative: Using environment variables (for Expo)
  // If you're using expo-constants, you can access env vars like this:
  /*
  import Constants from 'expo-constants';
  
  const config = {
    API_URL: Constants.expoConfig?.extra?.apiUrl || ENV[currentEnv].API_URL,
    STRIPE_PUBLISHABLE_KEY: Constants.expoConfig?.extra?.stripeKey || ENV[currentEnv].STRIPE_PUBLISHABLE_KEY,
    WS_URL: Constants.expoConfig?.extra?.wsUrl || ENV[currentEnv].WS_URL,
    ENV: currentEnv,
    IS_DEV: currentEnv === 'development',
    IS_PROD: currentEnv === 'production',
  };
  
  export default config;
  */
  
  // For app.json/app.config.js, add:
  /*
  {
    "expo": {
      "extra": {
        "apiUrl": "http://localhost:5000/api",
        "stripeKey": "pk_test_xxxxxxxxxxxxxxxxxxxxx",
        "wsUrl": "http://localhost:5000"
      }
    }
  }
  */
