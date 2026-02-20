const express = require('express');
const router = express.Router();

// Import controller
const stockController = require('../controllers/stock-data-controller');

// Import middleware
const checkAuth = require('../middleware/check-auth');

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

// Get real-time stock quote
router.get('/quote/:symbol', stockController.getQuote);

// Get multiple quotes
router.post('/quotes', stockController.getMultipleQuotes);

// Search stocks
router.get('/search', stockController.searchStocks);

// Get stock information
router.get('/info/:symbol', stockController.getStockInfo);

// Get historical data
router.get('/history/:symbol', stockController.getHistoricalData);

// Get market status
router.get('/market-status', stockController.getMarketStatus);

// Get market calendar
router.get('/market-calendar', stockController.getMarketCalendar);

// Get trending stocks
router.get('/trending', stockController.getTrendingStocks);

// Get popular ETFs
router.get('/etfs', stockController.getPopularETFs);

router.get('/current-price/:symbol', checkAuth, stockController.getCurrentPrice);


// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================

// These routes could be used for user-specific features
// like watchlists, alerts, or portfolio tracking

// Example: Get user's watchlist stocks
// router.get('/watchlist', checkAuth, stockController.getWatchlist);

// Example: Add stock to watchlist
// router.post('/watchlist', checkAuth, stockController.addToWatchlist);

module.exports = router;