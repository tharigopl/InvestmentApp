import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { Searchbar, List, Chip } from 'react-native-paper';
import { searchStocks, getTrendingStocks } from '../util/stocks';

export default function StockBrowser({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    const stocks = await getTrendingStocks();
    setTrending(stocks);
  };

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length > 1) {
      const stocks = await searchStocks(text);
      setResults(stocks);
    }
  };

  return (
    <View>
      <Searchbar
        placeholder="Search stocks & ETFs"
        value={query}
        onChangeText={handleSearch}
      />
      
      {query === '' && (
        <View style={{ padding: 16 }}>
          <Text variant="titleMedium">Trending Investments</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {trending.map(stock => (
              <Chip key={stock.symbol} onPress={() => onSelect(stock)}>
                {stock.symbol}
              </Chip>
            ))}
          </View>
        </View>
      )}
      
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <List.Item
            title={item.symbol}
            description={`${item.name} - $${item.price}`}
            left={props => <List.Icon {...props} icon="chart-line" />}
            right={props => <Text>${item.price}</Text>}
            onPress={() => onSelect(item)}
          />
        )}
      />
    </View>
  );
}