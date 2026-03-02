// client/components/StockPicker.js - UPDATED
// ✅ Fixed: Modal now stays open for multiple selections
// ✅ Updated: Early Bird color scheme (Coral & Turquoise)
// ✅ Enhanced: Better UI with selected preview in modal

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { searchStocks, getTrendingStocks, getStockQuote } from '../util/stocks';

const StockPicker = ({ selectedStocks = [], onStocksChange, maxSelections = 5 }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  useEffect(() => {
    loadTrendingStocks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(() => handleSearch(searchQuery), 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadTrendingStocks = async () => {
    try {
      setIsLoadingTrending(true);
      const trending = await getTrendingStocks();
      setTrendingStocks(trending?.topGainers || trending || []);
    } catch (error) {
      console.error('Error loading trending stocks:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setIsSearching(true);
      const results = await searchStocks(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = async (stock) => {
    if (selectedStocks.find(s => s.symbol === stock.symbol)) return;
    if (selectedStocks.length >= maxSelections) {
      alert(`You can only select up to ${maxSelections} stocks`);
      return;
    }

    try {
      const quote = await getStockQuote(stock.symbol);
      const stockWithQuote = {
        symbol: stock.symbol,
        name: stock.name || stock['2. name'] || stock.symbol,
        price: quote.price || parseFloat(quote['05. price']) || 0,
        type: stock.type || stock['3. type'] || 'stock',
      };
      onStocksChange([...selectedStocks, stockWithQuote]);
      // ✅ FIXED: Don't close modal - allows multiple selections
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching quote:', error);
      const basicStock = {
        symbol: stock.symbol,
        name: stock.name || stock['2. name'] || stock.symbol,
        price: 0,
        type: stock.type || stock['3. type'] || 'stock',
      };
      onStocksChange([...selectedStocks, basicStock]);
    }
  };

  const handleRemoveStock = (symbol) => {
    onStocksChange(selectedStocks.filter(s => s.symbol !== symbol));
  };

  const renderSelectedStock = ({ item }) => (
    <View style={styles.selectedStockCard}>
      <View style={styles.stockHeader}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <TouchableOpacity onPress={() => handleRemoveStock(item.symbol)}>
          <Ionicons name="close-circle" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
      {item.price > 0 && (
        <Text style={styles.stockPrice}>${item.price.toFixed(2)}</Text>
      )}
    </View>
  );

  const renderSearchResult = ({ item }) => {
    const symbol = item.symbol || item['1. symbol'] || '';
    const name = item.name || item['2. name'] || '';
    const isSelected = selectedStocks.find(s => s.symbol === symbol);

    return (
      <TouchableOpacity
        style={[styles.searchResultItem, isSelected && styles.searchResultItemSelected]}
        onPress={() => handleSelectStock(item)}
        disabled={isSelected}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultSymbol}>{symbol}</Text>
          <Text style={styles.searchResultName} numberOfLines={2}>{name}</Text>
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
        ) : (
          <Ionicons name="add-circle-outline" size={28} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Selected Stocks/ETFs</Text>
        <Text style={styles.counter}>{selectedStocks.length}/{maxSelections}</Text>
      </View>

      {selectedStocks.length > 0 && (
        <FlatList
          data={selectedStocks}
          renderItem={renderSelectedStock}
          keyExtractor={(item) => item.symbol}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedList}
        />
      )}

      <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={() => setModalVisible(true)}
        disabled={selectedStocks.length >= maxSelections}
      >
        <LinearGradient
          colors={selectedStocks.length >= maxSelections ? ['#CCC', '#999'] : ['#4ECDC4', '#44A08D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>
            {selectedStocks.length >= maxSelections ? 'Max Reached' : 'Add Stocks'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Stocks</Text>
              <Text style={styles.modalSubtitle}>{selectedStocks.length}/{maxSelections} selected</Text>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by symbol or company name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {selectedStocks.length > 0 && (
            <View style={styles.modalSelectedPreview}>
              <Text style={styles.previewTitle}>Selected ({selectedStocks.length})</Text>
              <FlatList
                data={selectedStocks}
                renderItem={({ item }) => (
                  <View style={styles.miniSelectedChip}>
                    <Text style={styles.miniChipText}>{item.symbol}</Text>
                    <TouchableOpacity onPress={() => handleRemoveStock(item.symbol)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.symbol}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.miniChipList}
              />
            </View>
          )}

          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#E5E5E5" />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try a different symbol or company name</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => `${item.symbol || item['1. symbol']}-${index}`}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View>
                <Text style={styles.sectionTitle}>
                  {isLoadingTrending ? 'Loading trending stocks...' : '📈 Trending Stocks'}
                </Text>
                {isLoadingTrending ? (
                  <View style={styles.trendingLoading}>
                    <ActivityIndicator size="small" color="#4ECDC4" />
                  </View>
                ) : (
                  <FlatList
                    data={trendingStocks}
                    renderItem={renderSearchResult}
                    keyExtractor={(item, index) => `trending-${item.symbol || index}`}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '700', color: '#333' },
  counter: { fontSize: 14, fontWeight: '600', color: '#4ECDC4', backgroundColor: '#F0FFFE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  selectedList: { paddingVertical: 8, paddingBottom: 12 },
  selectedStockCard: { backgroundColor: '#F0FFFE', borderRadius: 12, padding: 14, marginRight: 12, minWidth: 130, borderWidth: 2, borderColor: '#4ECDC4', shadowColor: '#4ECDC4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stockSymbol: { fontSize: 18, fontWeight: '800', color: '#4ECDC4' },
  stockName: { fontSize: 12, color: '#666', marginBottom: 6, lineHeight: 16 },
  stockPrice: { fontSize: 16, fontWeight: '700', color: '#333' },
  addButtonContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontWeight: '600', color: '#4ECDC4' },
  doneButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, margin: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  searchInput: { flex: 1, fontSize: 16, color: '#333', marginLeft: 10 },
  modalSelectedPreview: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  miniChipList: { gap: 8 },
  miniSelectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4ECDC4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  miniChipText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  resultsContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, marginTop: 8 },
  trendingLoading: { paddingVertical: 20 },
  searchResultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: '#E5E5E5' },
  searchResultItemSelected: { backgroundColor: '#F0FFFE', borderColor: '#4ECDC4' },
  searchResultInfo: { flex: 1, marginRight: 12 },
  searchResultSymbol: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 4 },
  searchResultName: { fontSize: 14, color: '#666', lineHeight: 18 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});

export default StockPicker;