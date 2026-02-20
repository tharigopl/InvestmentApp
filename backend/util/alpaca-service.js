const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true, // Use paper trading for testing
});

exports.buyStocks = async (stocks, accountId) => {
  const orders = [];
  
  for (const stock of stocks) {
    const order = await alpaca.createOrder({
      symbol: stock.symbol,
      qty: stock.shares,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
    
    orders.push(order);
  }
  
  return orders;
};