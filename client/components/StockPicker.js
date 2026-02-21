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
import { GlobalStyles } from '../constants/styles';
import { searchStocks, getTrendingStocks, getStockQuote } from '../util/stocks';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * StockPicker Component
 * Allows users to search and select stocks/ETFs for investment
 */
const StockPicker = ({ selectedStocks = [], onStocksChange, maxSelections = 5 }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Load trending stocks on mount
  useEffect(() => {
    loadTrendingStocks();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

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
    // Check if already selected
    if (selectedStocks.find(s => s.symbol === stock.symbol)) {
      return;
    }

    // Check max selections
    if (selectedStocks.length >= maxSelections) {
      alert(`You can only select up to ${maxSelections} stocks`);
      return;
    }

    // Fetch latest quote
    try {
      const quote = await getStockQuote(stock.symbol);
      const stockWithQuote = {
        symbol: stock.symbol,
        name: stock.name || stock['2. name'] || stock.symbol,
        price: quote.price || parseFloat(quote['05. price']) || 0,
        type: stock.type || stock['3. type'] || 'stock',
      };

      onStocksChange([...selectedStocks, stockWithQuote]);
      setModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Add anyway with basic info
      const basicStock = {
        symbol: stock.symbol,
        name: stock.name || stock['2. name'] || stock.symbol,
        price: 0,
        type: stock.type || stock['3. type'] || 'stock',
      };
      onStocksChange([...selectedStocks, basicStock]);
      setModalVisible(false);
    }
  };

  const handleRemoveStock = (symbol) => {
    onStocksChange(selectedStocks.filter(s => s.symbol !== symbol));
  };

  const renderSelectedStock = ({ item }) => (
    <View style={styles.selectedStockCard}>
      <View style={styles.stockInfo}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <TouchableOpacity onPress={() => handleRemoveStock(item.symbol)}>
            <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.error500} />
          </TouchableOpacity>
        </View>
        <Text style={styles.stockName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.price > 0 && (
          <Text style={styles.stockPrice}>${item.price.toFixed(2)}</Text>
        )}
      </View>
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
      >
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultSymbol}>{symbol}</Text>
          <Text style={styles.searchResultName} numberOfLines={2}>
            {name}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={GlobalStyles.colors.success500} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Stocks/ETFs ({selectedStocks.length}/{maxSelections})</Text>

      {/* Selected Stocks */}
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

      {/* Add Stock Button */}
      <TouchableOpacity
        style={[
          styles.createButtonContainer, { flex: 1 },
          selectedStocks.length >= maxSelections && styles.addButtonDisabled,
        ]}
        onPress={() => setModalVisible(true)}
        disabled={selectedStocks.length >= maxSelections}
      >
        <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Stock</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Stocks</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={GlobalStyles.colors.gray700} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={GlobalStyles.colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by symbol or company name"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.gray400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color={GlobalStyles.colors.gray300} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try searching for a different stock or ETF</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => `${item.symbol || item['1. symbol']}-${index}`}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              // Show trending stocks when no search
              <View>
                <Text style={styles.sectionTitle}>
                  {isLoadingTrending ? 'Loading...' : 'Trending Stocks'}
                </Text>
                {isLoadingTrending ? (
                  <ActivityIndicator size="small" color={GlobalStyles.colors.primary500} />
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
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginBottom: 12,
  },
  selectedList: {
    paddingVertical: 8,
  },
  selectedStockCard: {
    backgroundColor: GlobalStyles.colors.primary50,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary200,
  },
  stockInfo: {
    flex: 1,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary700,
  },
  stockName: {
    fontSize: 12,
    color: GlobalStyles.colors.gray600,
    marginBottom: 4,
  },
  stockPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray200,
  },
  searchResultItemSelected: {
    backgroundColor: GlobalStyles.colors.gray100,
    borderColor: GlobalStyles.colors.success500,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 12,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: GlobalStyles.colors.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    textAlign: 'center',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
});

export default StockPicker;