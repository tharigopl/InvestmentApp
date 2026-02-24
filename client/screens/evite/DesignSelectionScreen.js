// client/screens/evite/DesignSelectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../util/api-client';

export default function DesignSelectionScreen({ route, navigation }) {
  const { eventType, eventTypeLabel } = route.params;
  
  const [templates, setTemplates] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [customImage, setCustomImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'custom'

  useEffect(() => {
    loadTemplates();
  }, [eventType]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/designs/templates?category=${eventType}`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load design templates');
      // Load some default templates as fallback
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedDesign({
      type: 'template',
      templateId: template._id,
      imageUrl: template.imageUrl,
      colors: template.colors,
    });
    setCustomImage(null);
  };

  const handleUploadCustom = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload custom designs');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImage(result.assets[0].uri);
        setSelectedDesign({
          type: 'custom',
          imageUrl: result.assets[0].uri,
        });
        setActiveTab('custom');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleContinue = () => {
    if (!selectedDesign) {
      Alert.alert('Select Design', 'Please select a template or upload a custom design');
      return;
    }

    // Navigate to event creation flow
    navigation.navigate('CreateEventFlow', {
      eventType,
      eventTypeLabel,
      design: selectedDesign,
    });
  };

  const handleSkip = () => {
    // Continue without design
    navigation.navigate('CreateEventFlow', {
      eventType,
      eventTypeLabel,
      design: { type: 'none' },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Design</Text>
          <Text style={styles.headerSubtitle}>{eventTypeLabel}</Text>
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons 
            name="grid" 
            size={20} 
            color={activeTab === 'templates' ? '#4ECDC4' : '#999'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'templates' && styles.tabTextActive
          ]}>
            Templates ({templates.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
          onPress={() => setActiveTab('custom')}
        >
          <Ionicons 
            name="cloud-upload" 
            size={20} 
            color={activeTab === 'custom' ? '#4ECDC4' : '#999'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'custom' && styles.tabTextActive
          ]}>
            Custom Upload
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'templates' ? (
          // Templates Tab
          <View style={styles.templatesContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.loadingText}>Loading templates...</Text>
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.emptyText}>Try uploading a custom design</Text>
              </View>
            ) : (
              <View style={styles.templatesGrid}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template._id}
                    style={[
                      styles.templateCard,
                      selectedDesign?.templateId === template._id && styles.templateCardSelected,
                    ]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <Image 
                      source={{ uri: template.imageUrl }}
                      style={styles.templateImage}
                      resizeMode="cover"
                    />
                    
                    {/* Overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.templateOverlay}
                    >
                      <Text style={styles.templateName}>{template.name}</Text>
                      {template.isPremium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="star" size={12} color="#FFD93D" />
                          <Text style={styles.premiumText}>Premium</Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* Selection Indicator */}
                    {selectedDesign?.templateId === template._id && (
                      <View style={styles.selectionOverlay}>
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={32} color="#fff" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          // Custom Upload Tab
          <View style={styles.customContainer}>
            {customImage ? (
              <View style={styles.customPreviewContainer}>
                <Image 
                  source={{ uri: customImage }}
                  style={styles.customPreview}
                  resizeMode="cover"
                />
                
                <View style={styles.customActions}>
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={handleUploadCustom}
                  >
                    <Ionicons name="images" size={20} color="#4ECDC4" />
                    <Text style={styles.changeButtonText}>Change Image</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => {
                      setCustomImage(null);
                      setSelectedDesign(null);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#FF6B6B" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadBox}
                onPress={handleUploadCustom}
              >
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="cloud-upload" size={64} color="#4ECDC4" />
                </View>
                <Text style={styles.uploadTitle}>Upload Custom Design</Text>
                <Text style={styles.uploadText}>
                  Tap to select an image from your library
                </Text>
                <Text style={styles.uploadHint}>
                  Recommended: 1200 x 630 pixels
                </Text>
              </TouchableOpacity>
            )}

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#4ECDC4" />
              <Text style={styles.infoText}>
                Upload your own design image. Supports JPG, PNG, and GIF formats up to 10MB.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      {selectedDesign && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#4ECDC4',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },

  // Templates Grid
  templatesContainer: {
    flex: 1,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '48%',
    aspectRatio: 16/9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  templateCardSelected: {
    borderColor: '#4ECDC4',
    borderWidth: 3,
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  templateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  templateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD93D',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(78, 205, 196, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  // Custom Upload
  customContainer: {
    flex: 1,
  },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  customPreviewContainer: {
    marginBottom: 20,
  },
  customPreview: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  customActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF9F0',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});