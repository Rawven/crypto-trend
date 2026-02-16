import axios from 'axios';

const BINANCE_API = 'https://api.binance.com/api/v3';

// 支持的币种 (Binance 交易对)
export const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', pair: 'BTCUSDT' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', pair: 'ETHUSDT' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', pair: 'BNBUSDT' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', pair: 'SOLUSDT' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', pair: 'XRPUSDT' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', pair: 'ADAUSDT' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', pair: 'DOGEUSDT' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', pair: 'DOTUSDT' }
];

// 获取实时价格
export async function getPrices(coinIds = SUPPORTED_COINS.map(c => c.id)) {
  try {
    const url = `${BINANCE_API}/ticker/24hr`;
    const { data } = await axios.get(url);
    
    const prices = SUPPORTED_COINS.map(coin => {
      const ticker = data.find(t => t.symbol === coin.pair);
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: ticker ? parseFloat(ticker.lastPrice) : 0,
        change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0
      };
    });
    
    return prices;
  } catch (error) {
    console.error('Binance API error:', error.message);
    throw error;
  }
}

// 获取K线数据
export async function getMarketChart(coinId, days = 30) {
  const coin = SUPPORTED_COINS.find(c => c.id === coinId);
  if (!coin) throw new Error('Coin not found');
  
  const interval = days <= 1 ? '1h' : days <= 7 ? '4h' : '1d';
  const limit = Math.min(days * 24, 1000);
  
  const url = `${BINANCE_API}/klines?symbol=${coin.pair}&interval=${interval}&limit=${limit}`;
  const { data } = await axios.get(url);
  
  return {
    prices: data.map(k => [k[0], parseFloat(k[4])]),
    market_caps: data.map(k => [k[0], 0]),
    total_volumes: data.map(k => [k[0], parseFloat(k[5])])
  };
}

// 获取OHLC数据
export async function getOHLC(coinId, days = 30) {
  const coin = SUPPORTED_COINS.find(c => c.id === coinId);
  if (!coin) throw new Error('Coin not found');
  
  const interval = days <= 1 ? '1h' : days <= 7 ? '4h' : '1d';
  const limit = Math.min(days * 24, 1000);
  
  const url = `${BINANCE_API}/klines?symbol=${coin.pair}&interval=${interval}&limit=${limit}`;
  const { data } = await axios.get(url);
  
  return data.map(k => ({
    timestamp: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4])
  }));
}
