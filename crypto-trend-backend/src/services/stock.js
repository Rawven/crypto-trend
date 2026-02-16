import axios from 'axios';

// A股和港股列表
export const SUPPORTED_STOCKS = [
  // A股 (上海/深圳)
  { id: 'sh600519', symbol: '贵州茅台', name: 'Kweichow Moutai', market: 'A股', exchange: 'SH', code: 'sh600519' },
  { id: 'sh600036', symbol: '招商银行', name: 'China Merchants Bank', market: 'A股', exchange: 'SH', code: 'sh600036' },
  { id: 'sh601318', symbol: '中国平安', name: 'Ping An Insurance', market: 'A股', exchange: 'SH', code: 'sh601318' },
  { id: 'sh600900', symbol: '长江电力', name: 'China Yangtze Power', market: 'A股', exchange: 'SH', code: 'sh600900' },
  { id: 'sz000858', symbol: '五粮液', name: 'Wuliangye Yibin', market: 'A股', exchange: 'SZ', code: 'sz000858' },
  { id: 'sz000333', symbol: '美的集团', name: 'Midea Group', market: 'A股', exchange: 'SZ', code: 'sz000333' },
  { id: 'sz002594', symbol: '比亚迪', name: 'BYD', market: 'A股', exchange: 'SZ', code: 'sz002594' },
  { id: 'sh688041', symbol: '中芯国际', name: 'SMIC', market: 'A股', exchange: 'SH', code: 'sh688041' },
  
  // 港股
  { id: 'hk00700', symbol: '腾讯控股', name: 'Tencent', market: '港股', exchange: 'HK', code: 'hk00700' },
  { id: 'hk09988', symbol: '阿里巴巴', name: 'Alibaba', market: '港股', exchange: 'HK', code: 'hk09988' },
  { id: 'hk00981', symbol: '中国移动', name: 'China Mobile', market: '港股', exchange: 'HK', code: 'hk00981' },
  { id: 'hk00939', symbol: '建设银行', name: 'CCB', market: '港股', exchange: 'HK', code: 'hk00939' },
  { id: 'hk01810', symbol: '小米集团', name: 'Xiaomi', market: '港股', exchange: 'HK', code: 'hk01810' },
  { id: 'hk03690', symbol: '美团', name: 'Meituan', market: '港股', exchange: 'HK', code: 'hk03690' },
  { id: 'hk02318', symbol: '中国平安(港)', name: 'Ping An (HK)', market: '港股', exchange: 'HK', code: 'hk02318' },
  { id: 'hk02020', symbol: '安踏体育', name: 'ANTA', market: '港股', exchange: 'HK', code: 'hk02020' }
];

// 腾讯财经API
const TENCENT_API = 'http://qt.gtimg.cn/q=';

// 解析腾讯股票数据
function parseTencentStock(data) {
  // 格式: v_股票代码="100~股票名称~代码~当前价格~昨收~开盘~成交量~成交额~最高~最低~..."
  const match = data.match(/="(.+)"/);
  if (!match) return null;
  
  const parts = match[1].split('~');
  if (parts.length < 10) return null;
  
  // 腾讯API字段:
  // 0: 市场代码, 1: 股票名称, 2: 股票代码, 3: 当前价格, 4: 昨收价
  // 5: 开盘价, 6: 成交量, 7: 成交额, 8: 最高价, 9: 最低价
  
  const currentPrice = parseFloat(parts[3]) || 0;
  const prevClose = parseFloat(parts[4]) || 0;
  const openPrice = parseFloat(parts[5]) || 0;
  const volume = parseFloat(parts[6]) || 0;
  const amount = parseFloat(parts[7]) || 0;
  const highPrice = parseFloat(parts[8]) || 0;
  const lowPrice = parseFloat(parts[9]) || 0;
  
  // 计算涨跌幅
  const change = currentPrice - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
  
  return {
    price: currentPrice,
    prevClose: prevClose,
    open: openPrice,
    high: highPrice,
    low: lowPrice,
    volume: volume,
    amount: amount,
    change: change,
    changePercent: changePercent
  };
}

// 获取单只股票价格
async function fetchStock(code) {
  const url = `${TENCENT_API}${code}`;
  
  try {
    const response = await axios.get(url, {
      timeout: 5000
    });
    
    const stockData = parseTencentStock(response.data);
    if (!stockData || stockData.price === 0) {
      return null;
    }
    
    return stockData;
  } catch (error) {
    console.error(`获取股票 ${code} 失败:`, error.message);
    return null;
  }
}

// 获取所有股票价格
export async function getPrices() {
  const results = [];
  
  for (const stock of SUPPORTED_STOCKS) {
    const data = await fetchStock(stock.code);
    
    if (data) {
      results.push({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        exchange: stock.exchange,
        price: data.price,
        change24h: data.changePercent,
        change: data.change,
        open: data.open,
        high: data.high,
        low: data.low,
        volume: data.volume,
        prevClose: data.prevClose
      });
    } else {
      // 如果获取失败，返回默认值
      results.push({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        exchange: stock.exchange,
        price: 0,
        change24h: 0,
        change: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0
      });
    }
  }
  
  return results;
}

// 获取单个股票详情
export async function getStockById(stockId) {
  const stock = SUPPORTED_STOCKS.find(s => s.id === stockId);
  if (!stock) return null;
  
  const data = await fetchStock(stock.code);
  if (!data) return null;
  
  return {
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    exchange: stock.exchange,
    price: data.price,
    change24h: data.changePercent,
    change: data.change,
    open: data.open,
    high: data.high,
    low: data.low,
    volume: data.volume
  };
}
