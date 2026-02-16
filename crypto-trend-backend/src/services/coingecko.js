import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// 支持的币种
export const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' }
];

// 获取实时价格
export async function getPrices(coinIds = SUPPORTED_COINS.map(c => c.id)) {
  const ids = coinIds.join(',');
  const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  
  const { data } = await axios.get(url);
  
  return SUPPORTED_COINS.map(coin => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    price: data[coin.id]?.usd || 0,
    change24h: data[coin.id]?.usd_24h_change || 0
  }));
}

// 获取K线数据（历史）
export async function getMarketChart(coinId, days = 30) {
  const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  
  const { data } = await axios.get(url);
  
  return {
    prices: data.prices, // [timestamp, price]
    market_caps: data.market_caps,
    total_volumes: data.total_volumes
  };
}

// 获取OHLC数据
export async function getOHLC(coinId, days = 30) {
  const url = `${COINGECKO_API}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  
  const { data } = await axios.get(url);
  
  // 返回格式: [timestamp, open, high, low, close]
  return data.map(item => ({
    timestamp: item[0],
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4]
  }));
}
