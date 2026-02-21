// client/constants/theme.js
// Navigation theme configuration

import { DefaultTheme } from '@react-navigation/native';

// App Colors
export const AppColors = {
  // Primary
  coral: '#FF6B6B',
  coralLight: '#FF8E53',
  
  // Secondary
  turquoise: '#4ECDC4',
  turquoiseDark: '#44A08D',
  turquoiseLight: '#95E1D3',
  
  // Accents
  yellow: '#FFD93D',
  mint: '#A8E6CF',
  
  // Backgrounds
  cream: '#FFF9F0',
  white: '#FFFFFF',
  cardBg: '#F8FCFF',
  
  // Text
  dark: '#333333',
  medium: '#666666',
  light: '#999999',
  
  // Semantic
  success: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#E8FFF8',
};

// Navigation Theme
export const AppNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AppColors.coral,
    background: AppColors.cream,
    card: AppColors.white,
    text: AppColors.dark,
    border: '#FFE5B4',
    notification: AppColors.turquoise,
  },
};

// Screen Options for Stack Navigator
export const StackScreenOptions = {
  headerStyle: {
    backgroundColor: AppColors.coral,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 20,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: AppColors.cream,
  },
};

// Tab Bar Options
export const TabBarOptions = {
  tabBarStyle: {
    backgroundColor: AppColors.white,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: AppColors.coral,
  tabBarInactiveTintColor: AppColors.light,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBarIconStyle: {
    marginBottom: 0,
  },
};

// Drawer Options
export const DrawerScreenOptions = {
  drawerStyle: {
    backgroundColor: AppColors.cream,
    width: 280,
  },
  drawerContentStyle: {
    paddingTop: 20,
  },
  drawerActiveTintColor: AppColors.coral,
  drawerInactiveTintColor: AppColors.medium,
  drawerActiveBackgroundColor: '#FFE5B4',
  drawerInactiveBackgroundColor: 'transparent',
  drawerLabelStyle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: -16,
  },
  drawerItemStyle: {
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 12,
  },
};

// Typography
export const Typography = {
  weights: {
    regular: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  sizes: {
    huge: 52,
    extraLarge: 36,
    large: 28,
    title: 20,
    body: 16,
    small: 14,
    caption: 12,
  },
};

// Border Radius
export const BorderRadius = {
  small: 12,
  medium: 16,
  large: 20,
  button: 25,
  circle: 999,
};

// Shadows
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: AppColors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};