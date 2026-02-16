const axios = require('axios');
const logger = require('./logger');

// Alpaca API Configuration
const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'; // Use paper trading by default
const ALPACA_DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';

// Create Alpaca API client
const alpacaClient = axios.create({
  baseURL: ALPACA_BASE_URL,
  headers: {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  },
});

// Create Alpaca Data API client
const alpacaDataClient = axios.create({
  baseURL: ALPACA_DATA_URL,
  headers: {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  },
});

// Cache for stock quotes (5 minute TTL)
const quoteCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// STOCK QUOTES
// ============================================

/**
 * Get real-time stock quote
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Quote data
 */
async function getStockQuote(symbol) {
  const startTime = Date.now();
  
  logger.info('stockService.getStockQuote - START', { symbol });

  try {
    // Check cache first
    const cached = getCachedQuote(symbol);
    if (cached) {
      logger.debug('Using cached quote', { symbol });
      return cached;
    }

    // Fetch latest trade
    const response = await alpacaDataClient.get(`/v2/stocks/${symbol}/trades/latest`);
    
    const trade = response.data.trade;
    
    const quote = {
      symbol: symbol,
      price: trade.p,
      size: trade.s,
      timestamp: trade.t,
      exchange: trade.x,
      conditions: trade.c,
      tape: trade.z,
    };

    // Cache the quote
    cacheQuote(symbol, quote);

    const duration = Date.now() - startTime;
    logger.info('stockService.getStockQuote - SUCCESS', {
      symbol,
      price: quote.price,
      duration: `${duration}ms`,
    });

    return quote;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getStockQuote - ERROR', {
      symbol,
      error: error.message,
      status: error.response?.status,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Get multiple stock quotes at once
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Object>} Object with symbol keys and quote values
 */
async function getMultipleQuotes(symbols) {
  const startTime = Date.now();
  
  logger.info('stockService.getMultipleQuotes - START', {
    symbols: symbols.join(','),
    count: symbols.length,
  });

  try {
    const quotes = {};
    const uncachedSymbols = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = getCachedQuote(symbol);
      if (cached) {
        quotes[symbol] = cached;
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached quotes
    if (uncachedSymbols.length > 0) {
      const symbolsParam = uncachedSymbols.join(',');
      const response = await alpacaDataClient.get('/v2/stocks/trades/latest', {
        params: { symbols: symbolsParam },
      });

      const trades = response.data.trades;
      
      for (const [symbol, trade] of Object.entries(trades)) {
        const quote = {
          symbol: symbol,
          price: trade.p,
          size: trade.s,
          timestamp: trade.t,
          exchange: trade.x,
        };
        
        quotes[symbol] = quote;
        cacheQuote(symbol, quote);
      }
    }

    const duration = Date.now() - startTime;
    logger.info('stockService.getMultipleQuotes - SUCCESS', {
      requested: symbols.length,
      returned: Object.keys(quotes).length,
      cached: symbols.length - uncachedSymbols.length,
      duration: `${duration}ms`,
    });

    return quotes;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getMultipleQuotes - ERROR', {
      symbols: symbols.join(','),
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// STOCK SEARCH
// ============================================

/**
 * Search for stocks by symbol or name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
async function searchStocks(query) {
  const startTime = Date.now();
  
  logger.info('stockService.searchStocks - START', { query });

  try {
    // Get all assets
    const response = await alpacaClient.get('/v2/assets', {
      params: {
        status: 'active',
        asset_class: 'us_equity',
      },
    });

    const assets = response.data;
    const searchQuery = query.toUpperCase();

    // Filter assets by symbol or name
    const matches = assets
      .filter(asset => {
        return (
          asset.symbol.includes(searchQuery) ||
          asset.name.toUpperCase().includes(searchQuery)
        );
      })
      .slice(0, 20) // Limit to 20 results
      .map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        tradable: asset.tradable,
        marginable: asset.marginable,
        shortable: asset.shortable,
      }));

    const duration = Date.now() - startTime;
    logger.info('stockService.searchStocks - SUCCESS', {
      query,
      resultsCount: matches.length,
      duration: `${duration}ms`,
    });

    return matches;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.searchStocks - ERROR', {
      query,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Get stock details/info
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Stock details
 */
async function getStockInfo(symbol) {
  const startTime = Date.now();
  
  logger.info('stockService.getStockInfo - START', { symbol });

  try {
    const response = await alpacaClient.get(`/v2/assets/${symbol}`);
    
    const asset = response.data;
    
    const info = {
      symbol: asset.symbol,
      name: asset.name,
      exchange: asset.exchange,
      assetClass: asset.class,
      status: asset.status,
      tradable: asset.tradable,
      marginable: asset.marginable,
      shortable: asset.shortable,
      easyToBorrow: asset.easy_to_borrow,
      fractionable: asset.fractionable,
    };

    const duration = Date.now() - startTime;
    logger.info('stockService.getStockInfo - SUCCESS', {
      symbol,
      name: info.name,
      duration: `${duration}ms`,
    });

    return info;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getStockInfo - ERROR', {
      symbol,
      error: error.message,
      status: error.response?.status,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// HISTORICAL DATA
// ============================================

/**
 * Get historical price data (bars)
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Options (timeframe, start, end, limit)
 * @returns {Promise<Array>} Array of price bars
 */
async function getHistoricalData(symbol, options = {}) {
  const startTime = Date.now();
  
  const {
    timeframe = '1Day', // 1Min, 5Min, 15Min, 1Hour, 1Day
    start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    end = new Date().toISOString(),
    limit = 100,
  } = options;

  logger.info('stockService.getHistoricalData - START', {
    symbol,
    timeframe,
    start,
    end,
    limit,
  });

  try {
    const response = await alpacaDataClient.get(`/v2/stocks/${symbol}/bars`, {
      params: {
        timeframe,
        start,
        end,
        limit,
      },
    });

    const bars = response.data.bars || [];
    
    const formattedBars = bars.map(bar => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
      tradeCount: bar.n,
      vwap: bar.vw,
    }));

    const duration = Date.now() - startTime;
    logger.info('stockService.getHistoricalData - SUCCESS', {
      symbol,
      barsReturned: formattedBars.length,
      duration: `${duration}ms`,
    });

    return formattedBars;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getHistoricalData - ERROR', {
      symbol,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// MARKET STATUS
// ============================================

/**
 * Check if market is currently open
 * @returns {Promise<Object>} Market status
 */
async function getMarketStatus() {
  const startTime = Date.now();
  
  logger.info('stockService.getMarketStatus - START');

  try {
    const response = await alpacaClient.get('/v2/clock');
    
    const clock = response.data;
    
    const status = {
      isOpen: clock.is_open,
      timestamp: clock.timestamp,
      nextOpen: clock.next_open,
      nextClose: clock.next_close,
    };

    const duration = Date.now() - startTime;
    logger.debug('stockService.getMarketStatus - SUCCESS', {
      isOpen: status.isOpen,
      duration: `${duration}ms`,
    });

    return status;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getMarketStatus - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Get market calendar
 * @param {Object} options - Start and end dates
 * @returns {Promise<Array>} Array of market days
 */
async function getMarketCalendar(options = {}) {
  const startTime = Date.now();
  
  const {
    start = new Date().toISOString().split('T')[0],
    end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  } = options;

  logger.info('stockService.getMarketCalendar - START', { start, end });

  try {
    const response = await alpacaClient.get('/v2/calendar', {
      params: { start, end },
    });

    const calendar = response.data.map(day => ({
      date: day.date,
      open: day.open,
      close: day.close,
    }));

    const duration = Date.now() - startTime;
    logger.info('stockService.getMarketCalendar - SUCCESS', {
      daysReturned: calendar.length,
      duration: `${duration}ms`,
    });

    return calendar;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getMarketCalendar - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// TRADING (For actual stock purchases)
// ============================================

/**
 * Place a market order
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Order confirmation
 */
async function placeMarketOrder(orderData) {
  const startTime = Date.now();
  
  const {
    symbol,
    qty,
    side, // 'buy' or 'sell'
    type = 'market',
    timeInForce = 'day',
    clientOrderId,
  } = orderData;

  logger.info('stockService.placeMarketOrder - START', {
    symbol,
    qty,
    side,
    clientOrderId,
  });

  try {
    const response = await alpacaClient.post('/v2/orders', {
      symbol,
      qty,
      side,
      type,
      time_in_force: timeInForce,
      client_order_id: clientOrderId,
    });

    const order = response.data;
    
    const orderInfo = {
      id: order.id,
      clientOrderId: order.client_order_id,
      symbol: order.symbol,
      qty: order.qty,
      side: order.side,
      type: order.type,
      status: order.status,
      filledQty: order.filled_qty,
      filledAvgPrice: order.filled_avg_price,
      submittedAt: order.submitted_at,
    };

    const duration = Date.now() - startTime;
    logger.info('stockService.placeMarketOrder - SUCCESS', {
      orderId: orderInfo.id,
      symbol,
      qty,
      status: orderInfo.status,
      duration: `${duration}ms`,
    });

    return orderInfo;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.placeMarketOrder - ERROR', {
      symbol,
      qty,
      side,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Get order status
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
async function getOrderStatus(orderId) {
  const startTime = Date.now();
  
  logger.info('stockService.getOrderStatus - START', { orderId });

  try {
    const response = await alpacaClient.get(`/v2/orders/${orderId}`);
    
    const order = response.data;

    const duration = Date.now() - startTime;
    logger.debug('stockService.getOrderStatus - SUCCESS', {
      orderId,
      status: order.status,
      duration: `${duration}ms`,
    });

    return {
      id: order.id,
      symbol: order.symbol,
      qty: order.qty,
      side: order.side,
      status: order.status,
      filledQty: order.filled_qty,
      filledAvgPrice: order.filled_avg_price,
      submittedAt: order.submitted_at,
      filledAt: order.filled_at,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getOrderStatus - ERROR', {
      orderId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
async function cancelOrder(orderId) {
  const startTime = Date.now();
  
  logger.info('stockService.cancelOrder - START', { orderId });

  try {
    await alpacaClient.delete(`/v2/orders/${orderId}`);

    const duration = Date.now() - startTime;
    logger.info('stockService.cancelOrder - SUCCESS', {
      orderId,
      duration: `${duration}ms`,
    });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.cancelOrder - ERROR', {
      orderId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// ACCOUNT INFO
// ============================================

/**
 * Get account information
 * @returns {Promise<Object>} Account details
 */
async function getAccountInfo() {
  const startTime = Date.now();
  
  logger.info('stockService.getAccountInfo - START');

  try {
    const response = await alpacaClient.get('/v2/account');
    
    const account = response.data;

    const duration = Date.now() - startTime;
    logger.debug('stockService.getAccountInfo - SUCCESS', {
      accountNumber: account.account_number,
      status: account.status,
      duration: `${duration}ms`,
    });

    return {
      id: account.id,
      accountNumber: account.account_number,
      status: account.status,
      currency: account.currency,
      cash: parseFloat(account.cash),
      portfolioValue: parseFloat(account.portfolio_value),
      buyingPower: parseFloat(account.buying_power),
      equity: parseFloat(account.equity),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('stockService.getAccountInfo - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// CACHE HELPERS
// ============================================

function getCachedQuote(symbol) {
  const cached = quoteCache.get(symbol);
  if (!cached) return null;

  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_TTL) {
    quoteCache.delete(symbol);
    return null;
  }

  return cached.data;
}

function cacheQuote(symbol, data) {
  quoteCache.set(symbol, {
    data,
    cachedAt: Date.now(),
  });
}

function clearCache() {
  quoteCache.clear();
  logger.info('Stock quote cache cleared');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate shares that can be bought with amount
 * @param {number} amount - Dollar amount
 * @param {number} price - Stock price
 * @returns {number} Number of shares (can be fractional)
 */
function calculateShares(amount, price) {
  if (!amount || !price || price <= 0) return 0;
  return amount / price;
}

/**
 * Calculate total cost for shares
 * @param {number} shares - Number of shares
 * @param {number} price - Stock price
 * @returns {number} Total cost
 */
function calculateCost(shares, price) {
  if (!shares || !price) return 0;
  return shares * price;
}

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

/**
 * Calculate price change percentage
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price
 * @returns {number} Percentage change
 */
function calculatePriceChange(currentPrice, previousPrice) {
  if (!previousPrice || previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Quotes
  getStockQuote,
  getMultipleQuotes,

  // Search
  searchStocks,
  getStockInfo,

  // Historical Data
  getHistoricalData,

  // Market Status
  getMarketStatus,
  getMarketCalendar,

  // Trading
  placeMarketOrder,
  getOrderStatus,
  cancelOrder,

  // Account
  getAccountInfo,

  // Cache
  clearCache,

  // Utilities
  calculateShares,
  calculateCost,
  formatPrice,
  calculatePriceChange,
};