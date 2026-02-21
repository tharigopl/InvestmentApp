// client/components/CustomHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CustomHeader = ({ 
  title, 
  navigation, 
  showBack = false,
  showMenu = false,
  rightAction = null,
  gradient = ['#FF6B6B', '#FF8E53'] // Default coral gradient
}) => {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Left Button */}
        {showMenu && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.openDrawer()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        
        {showBack && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {!showMenu && !showBack && <View style={styles.iconButton} />}

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Action */}
        {rightAction ? (
          <View style={styles.iconButton}>
            {rightAction}
          </View>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 44, // For status bar
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
});

export default CustomHeader;