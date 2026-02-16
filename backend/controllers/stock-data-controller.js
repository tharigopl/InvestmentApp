const logger = require('../util/logger');
const stockService = require('../util/stock-service');
const HttpError = require('../models/http-error');

// ============================================
// STOCK QUOTES
// ============================================

/**
 * Get real-time stock quote
 * GET /api/stocks/quote/:symbol
 */
const getQuote = async (req, res, next) => {
  const startTime = Date.now();
  const { symbol } = req.params;

  logger.info('getQuote - START', {
    symbol,
    requestId: req.id,
  });

  try {
    const quote = await stockService.getStockQuote(symbol.toUpperCase());

    const duration = Date.now() - startTime;
    logger.info('getQuote - SUCCESS', {
      symbol,
      price: quote.price,
      duration: `${duration}ms`,
    });

    res.json({
      quote,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getQuote - ERROR', {
      symbol,
      error: error.message,
      status: error.response?.status,
      duration: `${duration}ms`,
    });

    if (error.response?.status === 404) {
      return next(new HttpError('Stock symbol not found', 404));
    }

    return next(
      new HttpError('Failed to fetch stock quote: ' + error.message, 500)
    );
  }
};

/**
 * Get multiple stock quotes
 * POST /api/stocks/quotes
 * Body: { symbols: ['AAPL', 'MSFT', 'GOOGL'] }
 */
const getMultipleQuotes = async (req, res, next) => {
  const startTime = Date.now();
  const { symbols } = req.body;

  logger.info('getMultipleQuotes - START', {
    symbols: symbols?.join(','),
    count: symbols?.length,
    requestId: req.id,
  });

  try {
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return next(new HttpError('Invalid symbols array', 400));
    }

    if (symbols.length > 50) {
      return next(new HttpError('Maximum 50 symbols allowed', 400));
    }

    const uppercaseSymbols = symbols.map(s => s.toUpperCase());
    const quotes = await stockService.getMultipleQuotes(uppercaseSymbols);

    const duration = Date.now() - startTime;
    logger.info('getMultipleQuotes - SUCCESS', {
      requested: symbols.length,
      returned: Object.keys(quotes).length,
      duration: `${duration}ms`,
    });

    res.json({
      quotes,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getMultipleQuotes - ERROR', {
      symbolCount: symbols?.length,
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch stock quotes: ' + error.message, 500)
    );
  }
};

// ============================================
// STOCK SEARCH
// ============================================

/**
 * Search for stocks
 * GET /api/stocks/search?q=apple
 */
const searchStocks = async (req, res, next) => {
  const startTime = Date.now();
  const { q: query } = req.query;

  logger.info('searchStocks - START', {
    query,
    requestId: req.id,
  });

  try {
    if (!query || query.trim().length === 0) {
      return next(new HttpError('Search query is required', 400));
    }

    if (query.length < 1) {
      return next(new HttpError('Query must be at least 1 character', 400));
    }

    const results = await stockService.searchStocks(query);

    const duration = Date.now() - startTime;
    logger.info('searchStocks - SUCCESS', {
      query,
      resultsCount: results.length,
      duration: `${duration}ms`,
    });

    res.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('searchStocks - ERROR', {
      query,
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to search stocks: ' + error.message, 500)
    );
  }
};

/**
 * Get stock information
 * GET /api/stocks/info/:symbol
 */
const getStockInfo = async (req, res, next) => {
  const startTime = Date.now();
  const { symbol } = req.params;

  logger.info('getStockInfo - START', {
    symbol,
    requestId: req.id,
  });

  try {
    const info = await stockService.getStockInfo(symbol.toUpperCase());

    const duration = Date.now() - startTime;
    logger.info('getStockInfo - SUCCESS', {
      symbol,
      name: info.name,
      duration: `${duration}ms`,
    });

    res.json({
      stock: info,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getStockInfo - ERROR', {
      symbol,
      error: error.message,
      status: error.response?.status,
      duration: `${duration}ms`,
    });

    if (error.response?.status === 404) {
      return next(new HttpError('Stock not found', 404));
    }

    return next(
      new HttpError('Failed to fetch stock info: ' + error.message, 500)
    );
  }
};

// ============================================
// HISTORICAL DATA
// ============================================

/**
 * Get historical price data
 * GET /api/stocks/history/:symbol?timeframe=1Day&limit=30
 */
const getHistoricalData = async (req, res, next) => {
  const startTime = Date.now();
  const { symbol } = req.params;
  const { timeframe = '1Day', limit = 30 } = req.query;

  logger.info('getHistoricalData - START', {
    symbol,
    timeframe,
    limit,
    requestId: req.id,
  });

  try {
    // Calculate start date based on limit
    const daysAgo = parseInt(limit) || 30;
    const start = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const bars = await stockService.getHistoricalData(symbol.toUpperCase(), {
      timeframe,
      start: start.toISOString(),
      end: new Date().toISOString(),
      limit: parseInt(limit),
    });

    const duration = Date.now() - startTime;
    logger.info('getHistoricalData - SUCCESS', {
      symbol,
      barsReturned: bars.length,
      timeframe,
      duration: `${duration}ms`,
    });

    res.json({
      symbol,
      timeframe,
      bars,
      count: bars.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getHistoricalData - ERROR', {
      symbol,
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch historical data: ' + error.message, 500)
    );
  }
};

// ============================================
// MARKET STATUS
// ============================================

/**
 * Get market status
 * GET /api/stocks/market-status
 */
const getMarketStatus = async (req, res, next) => {
  const startTime = Date.now();

  logger.info('getMarketStatus - START', {
    requestId: req.id,
  });

  try {
    const status = await stockService.getMarketStatus();

    const duration = Date.now() - startTime;
    logger.debug('getMarketStatus - SUCCESS', {
      isOpen: status.isOpen,
      duration: `${duration}ms`,
    });

    res.json({
      market: status,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getMarketStatus - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch market status: ' + error.message, 500)
    );
  }
};

/**
 * Get market calendar
 * GET /api/stocks/market-calendar?days=30
 */
const getMarketCalendar = async (req, res, next) => {
  const startTime = Date.now();
  const { days = 30 } = req.query;

  logger.info('getMarketCalendar - START', {
    days,
    requestId: req.id,
  });

  try {
    const daysInt = parseInt(days) || 30;
    const start = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + daysInt * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const calendar = await stockService.getMarketCalendar({ start, end });

    const duration = Date.now() - startTime;
    logger.info('getMarketCalendar - SUCCESS', {
      daysReturned: calendar.length,
      duration: `${duration}ms`,
    });

    res.json({
      calendar,
      count: calendar.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getMarketCalendar - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch market calendar: ' + error.message, 500)
    );
  }
};

// ============================================
// TRENDING/POPULAR STOCKS
// ============================================

/**
 * Get trending stocks (hardcoded popular symbols)
 * GET /api/stocks/trending
 */
const getTrendingStocks = async (req, res, next) => {
  const startTime = Date.now();

  logger.info('getTrendingStocks - START', {
    requestId: req.id,
  });

  try {
    // Popular stock symbols
    const trendingSymbols = [
      'AAPL', // Apple
      'MSFT', // Microsoft
      'GOOGL', // Google
      'AMZN', // Amazon
      'TSLA', // Tesla
      'META', // Meta/Facebook
      'NVDA', // NVIDIA
      'JPM', // JP Morgan
      'V', // Visa
      'WMT', // Walmart
    ];

    const quotes = await stockService.getMultipleQuotes(trendingSymbols);

    // Convert to array format with additional info
    const trending = await Promise.all(
      trendingSymbols.map(async (symbol) => {
        try {
          const info = await stockService.getStockInfo(symbol);
          return {
            symbol,
            name: info.name,
            price: quotes[symbol]?.price || 0,
            timestamp: quotes[symbol]?.timestamp,
          };
        } catch (error) {
          logger.warn('Failed to get info for trending stock', {
            symbol,
            error: error.message,
          });
          return {
            symbol,
            name: symbol,
            price: quotes[symbol]?.price || 0,
            timestamp: quotes[symbol]?.timestamp,
          };
        }
      })
    );

    const duration = Date.now() - startTime;
    logger.info('getTrendingStocks - SUCCESS', {
      count: trending.length,
      duration: `${duration}ms`,
    });

    res.json({
      trending,
      count: trending.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getTrendingStocks - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch trending stocks: ' + error.message, 500)
    );
  }
};

/**
 * Get popular ETFs
 * GET /api/stocks/etfs
 */
const getPopularETFs = async (req, res, next) => {
  const startTime = Date.now();

  logger.info('getPopularETFs - START', {
    requestId: req.id,
  });

  try {
    // Popular ETF symbols
    const etfSymbols = [
      'SPY', // S&P 500
      'QQQ', // NASDAQ 100
      'VOO', // Vanguard S&P 500
      'VTI', // Total Stock Market
      'IWM', // Russell 2000
      'DIA', // Dow Jones
      'VEA', // Developed Markets
      'VWO', // Emerging Markets
      'AGG', // Aggregate Bond
      'GLD', // Gold
    ];

    const quotes = await stockService.getMultipleQuotes(etfSymbols);

    const etfs = await Promise.all(
      etfSymbols.map(async (symbol) => {
        try {
          const info = await stockService.getStockInfo(symbol);
          return {
            symbol,
            name: info.name,
            price: quotes[symbol]?.price || 0,
            timestamp: quotes[symbol]?.timestamp,
          };
        } catch (error) {
          return {
            symbol,
            name: symbol,
            price: quotes[symbol]?.price || 0,
            timestamp: quotes[symbol]?.timestamp,
          };
        }
      })
    );

    const duration = Date.now() - startTime;
    logger.info('getPopularETFs - SUCCESS', {
      count: etfs.length,
      duration: `${duration}ms`,
    });

    res.json({
      etfs,
      count: etfs.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getPopularETFs - ERROR', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch popular ETFs: ' + error.message, 500)
    );
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Quotes
  getQuote,
  getMultipleQuotes,

  // Search
  searchStocks,
  getStockInfo,

  // Historical
  getHistoricalData,

  // Market
  getMarketStatus,
  getMarketCalendar,

  // Discovery
  getTrendingStocks,
  getPopularETFs,
};