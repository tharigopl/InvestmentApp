// client/util/stocks.js
import apiClient from './api-client';

/**
 * Get real-time stock quote
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Quote data
 */
export async function getStockQuote(symbol) {
  try {
    const response = await apiClient.get(`/stocks/quote/${symbol.toUpperCase()}`);
    return response.data.quote;
  } catch (error) {
    console.error('Get stock quote error:', error.message);
    throw error;
  }
}

/**
 * Get multiple stock quotes at once
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Object>} Object with symbol keys and quote values
 */
export async function getMultipleQuotes(symbols) {
  try {
    const response = await apiClient.post('/stocks/quotes', {
      symbols: symbols.map(s => s.toUpperCase()),
    });
    return response.data.quotes || {};
  } catch (error) {
    console.error('Get multiple quotes error:', error.message);
    throw error;
  }
}

/**
 * Search for stocks
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
export async function searchStocks(query) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await apiClient.get('/stocks/search', {
      params: { q: query },
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Search stocks error:', error.message);
    throw error;
  }
}

/**
 * Get stock information
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Stock details
 */
export async function getStockInfo(symbol) {
  try {
    const response = await apiClient.get(`/stocks/info/${symbol.toUpperCase()}`);
    return response.data.stock;
  } catch (error) {
    console.error('Get stock info error:', error.message);
    throw error;
  }
}

/**
 * Get historical price data
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Options (timeframe, limit)
 * @returns {Promise<Array>} Array of price bars
 */
export async function getHistoricalData(symbol, options = {}) {
  try {
    const { timeframe = '1Day', limit = 30 } = options;

    const response = await apiClient.get(`/stocks/history/${symbol.toUpperCase()}`, {
      params: { timeframe, limit },
    });

    return response.data.bars || [];
  } catch (error) {
    console.error('Get historical data error:', error.message);
    throw error;
  }
}

/**
 * Get market status
 * @returns {Promise<Object>} Market status
 */
export async function getMarketStatus() {
  try {
    const response = await apiClient.get('/stocks/market-status');
    return response.data.market;
  } catch (error) {
    console.error('Get market status error:', error.message);
    throw error;
  }
}

/**
 * Get market calendar
 * @param {number} days - Number of days to fetch
 * @returns {Promise<Array>} Array of market days
 */
export async function getMarketCalendar(days = 30) {
  try {
    const response = await apiClient.get('/stocks/market-calendar', {
      params: { days },
    });
    return response.data.calendar || [];
  } catch (error) {
    console.error('Get market calendar error:', error.message);
    throw error;
  }
}

/**
 * Get trending stocks
 * @returns {Promise<Array>} Array of trending stocks
 */
export async function getTrendingStocks() {
  try {
    const response = await apiClient.get('/stocks/trending');
    return response.data.trending || response.data.topGainers || [];
  } catch (error) {
    console.error('Get trending stocks error:', error.message);
    // Return empty array instead of throwing to allow graceful fallback
    return [];
  }
}

/**
 * Get popular ETFs
 * @returns {Promise<Array>} Array of popular ETFs
 */
export async function getPopularETFs() {
  try {
    const response = await apiClient.get('/stocks/etfs');
    return response.data.etfs || [];
  } catch (error) {
    console.error('Get popular ETFs error:', error.message);
    return [];
  }
}

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
export function formatPrice(price) {
  if (!price) return '$0.00';
  return `$${parseFloat(price).toFixed(2)}`;
}

/**
 * Calculate price change percentage
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price
 * @returns {number} Percentage change
 */
export function calculatePriceChange(currentPrice, previousPrice) {
  if (!previousPrice || previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Calculate shares that can be bought
 * @param {number} amount - Dollar amount
 * @param {number} price - Stock price
 * @returns {number} Number of shares (can be fractional)
 */
export function calculateShares(amount, price) {
  if (!amount || !price || price <= 0) return 0;
  return amount / price;
}

/**
 * Calculate total cost for shares
 * @param {number} shares - Number of shares
 * @param {number} price - Stock price
 * @returns {number} Total cost
 */
export function calculateCost(shares, price) {
  if (!shares || !price) return 0;
  return shares * price;
}

/**
 * Format price change for display
 * @param {number} change - Price change amount
 * @param {number} changePercent - Price change percentage
 * @returns {Object} Formatted change with color
 */
export function formatPriceChange(change, changePercent) {
  const isPositive = change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  const symbol = isPositive ? '+' : '';

  return {
    change: `${symbol}$${Math.abs(change).toFixed(2)}`,
    percent: `${symbol}${changePercent.toFixed(2)}%`,
    color,
    isPositive,
  };
}

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol
 * @returns {boolean} Is valid
 */
export function isValidSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  // Stock symbols are 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}

/**
 * Cache for stock quotes (client-side caching)
 */
const quoteCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached quote or fetch new
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Quote data
 */
export async function getCachedQuote(symbol) {
  const cached = quoteCache.get(symbol);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const quote = await getStockQuote(symbol);
  quoteCache.set(symbol, {
    data: quote,
    timestamp: Date.now(),
  });

  return quote;
}

/**
 * Clear quote cache
 */
export function clearQuoteCache() {
  quoteCache.clear();
}