import axios from 'axios';

// A股和港股列表 - 全量热门股票 (去重)
export const SUPPORTED_STOCKS = [
  // A股 - 上海交易所 (上证50 + 沪深300热门)
  { id: 'sh600519', symbol: '贵州茅台', name: 'Kweichow Moutai', market: 'A股', exchange: 'SH', code: 'sh600519' },
  { id: 'sh600036', symbol: '招商银行', name: 'China Merchants Bank', market: 'A股', exchange: 'SH', code: 'sh600036' },
  { id: 'sh601318', symbol: '中国平安', name: 'Ping An Insurance', market: 'A股', exchange: 'SH', code: 'sh601318' },
  { id: 'sh600900', symbol: '长江电力', name: 'China Yangtze Power', market: 'A股', exchange: 'SH', code: 'sh600900' },
  { id: 'sh600030', symbol: '中信证券', name: 'CITIC Securities', market: 'A股', exchange: 'SH', code: 'sh600030' },
  { id: 'sh600028', symbol: '中国石化', name: 'Sinopec', market: 'A股', exchange: 'SH', code: 'sh600028' },
  { id: 'sh601857', symbol: '中国石油', name: 'PetroChina', market: 'A股', exchange: 'SH', code: 'sh601857' },
  { id: 'sh601888', symbol: '中国中铁', name: 'China Railway', market: 'A股', exchange: 'SH', code: 'sh601888' },
  { id: 'sh601668', symbol: '中国建筑', name: 'China State Constr', market: 'A股', exchange: 'SH', code: 'sh601668' },
  { id: 'sh601988', symbol: '中国银行', name: 'Bank of China', market: 'A股', exchange: 'SH', code: 'sh601988' },
  { id: 'sh601398', symbol: '工商银行', name: 'ICBC', market: 'A股', exchange: 'SH', code: 'sh601398' },
  { id: 'sh600050', symbol: '中国联通', name: 'China Unicom', market: 'A股', exchange: 'SH', code: 'sh600050' },
  { id: 'sh600016', symbol: '民生银行', name: 'China Minsheng', market: 'A股', exchange: 'SH', code: 'sh600016' },
  { id: 'sh600000', symbol: '浦发银行', name: 'Shanghai Pudong', market: 'A股', exchange: 'SH', code: 'sh600000' },
  { id: 'sh600104', symbol: '上汽集团', name: 'SAIC Group', market: 'A股', exchange: 'SH', code: 'sh600104' },
  { id: 'sh600309', symbol: '万华化学', name: 'Wanhua Chemical', market: 'A股', exchange: 'SH', code: 'sh600309' },
  { id: 'sh600585', symbol: '海螺水泥', name: 'Conch Cement', market: 'A股', exchange: 'SH', code: 'sh600585' },
  { id: 'sh600690', symbol: '青岛海尔', name: 'Haier', market: 'A股', exchange: 'SH', code: 'sh600690' },
  { id: 'sh600276', symbol: '恒瑞医药', name: 'Hengrui Medicine', market: 'A股', exchange: 'SH', code: 'sh600276' },
  { id: 'sh600031', symbol: '三一重工', name: 'SANY', market: 'A股', exchange: 'SH', code: 'sh600031' },
  { id: 'sh600547', symbol: '山东黄金', name: 'Shandong Gold', market: 'A股', exchange: 'SH', code: 'sh600547' },
  { id: 'sh601111', symbol: '中国国航', name: 'Air China', market: 'A股', exchange: 'SH', code: 'sh601111' },
  { id: 'sh600009', symbol: '上海机场', name: 'Shanghai Airport', market: 'A股', exchange: 'SH', code: 'sh600009' },
  { id: 'sh600018', symbol: '上港集团', name: 'Shanghai Port', market: 'A股', exchange: 'SH', code: 'sh600018' },
  { id: 'sh600150', symbol: '中国船舶', name: 'China Shipbuilding', market: 'A股', exchange: 'SH', code: 'sh600150' },
  
  // A股 - 深圳交易所 (创业板 + 中小板热门)
  { id: 'sz000858', symbol: '五粮液', name: 'Wuliangye Yibin', market: 'A股', exchange: 'SZ', code: 'sz000858' },
  { id: 'sz000333', symbol: '美的集团', name: 'Midea Group', market: 'A股', exchange: 'SZ', code: 'sz000333' },
  { id: 'sz002594', symbol: '比亚迪', name: 'BYD', market: 'A股', exchange: 'SZ', code: 'sz002594' },
  { id: 'sh688041', symbol: '中芯国际', name: 'SMIC', market: 'A股', exchange: 'SH', code: 'sh688041' },
  { id: 'sz000001', symbol: '平安银行', name: 'Ping An Bank', market: 'A股', exchange: 'SZ', code: 'sz000001' },
  { id: 'sz000002', symbol: '万科A', name: 'Vanke', market: 'A股', exchange: 'SZ', code: 'sz000002' },
  { id: 'sz000651', symbol: '格力电器', name: 'Gree Electric', market: 'A股', exchange: 'SZ', code: 'sz000651' },
  { id: 'sz000725', symbol: '京东方A', name: 'BOE', market: 'A股', exchange: 'SZ', code: 'sz000725' },
  { id: 'sz000768', symbol: '中航飞机', name: 'AVIC Aircraft', market: 'A股', exchange: 'SZ', code: 'sz000768' },
  { id: 'sz000538', symbol: '云南白药', name: 'Yunnan Baiyao', market: 'A股', exchange: 'SZ', code: 'sz000538' },
  { id: 'sz000423', symbol: '同仁堂', name: 'Tong Ren Tang', market: 'A股', exchange: 'SZ', code: 'sz000423' },
  { id: 'sz000596', symbol: '古井贡酒', name: 'Gujing Gong', market: 'A股', exchange: 'SZ', code: 'sz000596' },
  { id: 'sz000895', symbol: '双汇发展', name: 'Shuanghui', market: 'A股', exchange: 'SZ', code: 'sz000895' },
  { id: 'sz000869', symbol: '张裕A', name: 'Changyu', market: 'A股', exchange: 'SZ', code: 'sz000869' },
  { id: 'sz000566', symbol: '海南海药', name: 'Hainan Haiyao', market: 'A股', exchange: 'SZ', code: 'sz000566' },
  { id: 'sz002230', symbol: '科大讯飞', name: 'iFlytek', market: 'A股', exchange: 'SZ', code: 'sz002230' },
  { id: 'sz002415', symbol: '海康威视', name: 'Hikvision', market: 'A股', exchange: 'SZ', code: 'sz002415' },
  { id: 'sz002475', symbol: '立讯精密', name: 'Luxshare Prec', market: 'A股', exchange: 'SZ', code: 'sz002475' },
  { id: 'sz002311', symbol: '海大集团', name: 'Haid Group', market: 'A股', exchange: 'SZ', code: 'sz002311' },
  { id: 'sz002236', symbol: '大华股份', name: 'Dahua Tech', market: 'A股', exchange: 'SZ', code: 'sz002236' },
  { id: 'sz002352', symbol: '民生控股', name: 'Minsheng Holding', market: 'A股', exchange: 'SZ', code: 'sz002352' },
  { id: 'sz002493', symbol: '恒逸石化', name: 'Hengyi Petro', market: 'A股', exchange: 'SZ', code: 'sz002493' },
  { id: 'sz002601', symbol: '龙蟒佰利', name: 'Lomon Billions', market: 'A股', exchange: 'SZ', code: 'sz002601' },
  { id: 'sz002714', symbol: '牧原股份', name: 'Muyuan Food', market: 'A股', exchange: 'SZ', code: 'sz002714' },
  { id: 'sz002736', symbol: '国光电器', name: 'Guoguang Etec', market: 'A股', exchange: 'SZ', code: 'sz002736' },
  { id: 'sz300059', symbol: '东方财富', name: 'East Money', market: 'A股', exchange: 'SZ', code: 'sz300059' },
  { id: 'sz300014', symbol: '亿纬锂能', name: 'EVE Energy', market: 'A股', exchange: 'SZ', code: 'sz300014' },
  { id: 'sz300015', symbol: '爱尔眼科', name: 'Aier Eye', market: 'A股', exchange: 'SZ', code: 'sz300015' },
  { id: 'sz300033', symbol: '同花顺', name: 'iFinD', market: 'A股', exchange: 'SZ', code: 'sz300033' },
  { id: 'sz300122', symbol: '智飞生物', name: 'Zhifei Bio', market: 'A股', exchange: 'SZ', code: 'sz300122' },
  { id: 'sz300142', symbol: '沃森生物', name: 'Wosin Bio', market: 'A股', exchange: 'SZ', code: 'sz300142' },
  { id: 'sz300750', symbol: '宁德时代', name: 'CATL', market: 'A股', exchange: 'SZ', code: 'sz300750' },
  { id: 'sz300498', symbol: '中科曙光', name: 'Sugon', market: 'A股', exchange: 'SZ', code: 'sz300498' },
  { id: 'sz300676', symbol: '华大基因', name: 'BGI', market: 'A股', exchange: 'SZ', code: 'sz300676' },
  { id: 'sz300347', symbol: '泰格医药', name: 'Tigermed', market: 'A股', exchange: 'SZ', code: 'sz300347' },
  
  // 港股 - 蓝筹 + 热门
  { id: 'hk00700', symbol: '腾讯控股', name: 'Tencent', market: '港股', exchange: 'HK', code: 'hk00700' },
  { id: 'hk09988', symbol: '阿里巴巴', name: 'Alibaba', market: '港股', exchange: 'HK', code: 'hk09988' },
  { id: 'hk00981', symbol: '中国移动', name: 'China Mobile', market: '港股', exchange: 'HK', code: 'hk00981' },
  { id: 'hk00939', symbol: '建设银行', name: 'CCB', market: '港股', exchange: 'HK', code: 'hk00939' },
  { id: 'hk01810', symbol: '小米集团', name: 'Xiaomi', market: '港股', exchange: 'HK', code: 'hk01810' },
  { id: 'hk03690', symbol: '美团', name: 'Meituan', market: '港股', exchange: 'HK', code: 'hk03690' },
  { id: 'hk02318', symbol: '中国平安(港)', name: 'Ping An (HK)', market: '港股', exchange: 'HK', code: 'hk02318' },
  { id: 'hk02020', symbol: '安踏体育', name: 'ANTA', market: '港股', exchange: 'HK', code: 'hk02020' },
  { id: 'hk01398', symbol: '工商银行(港)', name: 'ICBC (HK)', market: '港股', exchange: 'HK', code: 'hk01398' },
  { id: 'hk03988', symbol: '中国银行(港)', name: 'BOC (HK)', market: '港股', exchange: 'HK', code: 'hk03988' },
  { id: 'hk00005', symbol: '汇丰控股', name: 'HSBC', market: '港股', exchange: 'HK', code: 'hk00005' },
  { id: 'hk00001', symbol: '长和', name: 'CK Hutchinson', market: '港股', exchange: 'HK', code: 'hk00001' },
  { id: 'hk00011', symbol: '恒生银行', name: 'Hang Seng Bank', market: '港股', exchange: 'HK', code: 'hk00011' },
  { id: 'hk00012', symbol: '九龙仓集团', name: 'Wharf Holdings', market: '港股', exchange: 'HK', code: 'hk00012' },
  { id: 'hk00013', symbol: '中华煤气', name: 'HK & China Gas', market: '港股', exchange: 'HK', code: 'hk00013' },
  { id: 'hk00016', symbol: '九龙仓置业', name: 'Wharf REIC', market: '港股', exchange: 'HK', code: 'hk00016' },
  { id: 'hk00017', symbol: '新鸿基地产', name: 'Sun Hung Kai', market: '港股', exchange: 'HK', code: 'hk00017' },
  { id: 'hk00019', symbol: '太古股份', name: 'Swire Pacific', market: '港股', exchange: 'HK', code: 'hk00019' },
  { id: 'hk00175', symbol: '吉利汽车', name: 'Geely Auto', market: '港股', exchange: 'HK', code: 'hk00175' },
  { id: 'hk00267', symbol: '中国铁建', name: 'China Railway', market: '港股', exchange: 'HK', code: 'hk00267' },
  { id: 'hk00386', symbol: '中国石化(港)', name: 'Sinopec (HK)', market: '港股', exchange: 'HK', code: 'hk00386' },
  { id: 'hk00388', symbol: '香港交易所', name: 'HKEX', market: '港股', exchange: 'HK', code: 'hk00388' },
  { id: 'hk00690', symbol: '中国中铁(港)', name: 'China Railway (HK)', market: '港股', exchange: 'HK', code: 'hk00690' },
  { id: 'hk00667', symbol: '中国中车', name: 'CRRC', market: '港股', exchange: 'HK', code: 'hk00667' },
  { id: 'hk06808', symbol: '京东健康', name: 'JD Health', market: '港股', exchange: 'HK', code: 'hk06808' },
  { id: 'hk09618', symbol: '京东集团', name: 'JD.com', market: '港股', exchange: 'HK', code: 'hk09618' },
  { id: 'hk09961', symbol: '携程集团', name: 'Trip.com', market: '港股', exchange: 'HK', code: 'hk09961' },
  { id: 'hk01024', symbol: '快手', name: 'Kuaishou', market: '港股', exchange: 'HK', code: 'hk01024' },
  { id: 'hk02331', symbol: '李宁', name: 'Li Ning', market: '港股', exchange: 'HK', code: 'hk02331' },
  { id: 'hk01928', symbol: '金沙中国', name: 'Las Vegas Sands', market: '港股', exchange: 'HK', code: 'hk01928' },
  { id: 'hk00027', symbol: '银河娱乐', name: 'Galaxy Ent', market: '港股', exchange: 'HK', code: 'hk00027' },
  { id: 'hk01171', symbol: '华润电力', name: 'China Resources Power', market: '港股', exchange: 'HK', code: 'hk01171' },
  { id: 'hk01169', symbol: '华润置地', name: 'China Resources Land', market: '港股', exchange: 'HK', code: 'hk01169' },
  { id: 'hk01193', symbol: '华润燃气', name: 'China Resources Gas', market: '港股', exchange: 'HK', code: 'hk01193' },
  { id: 'hk02628', symbol: '中国人寿', name: 'China Life', market: '港股', exchange: 'HK', code: 'hk02628' },
  { id: 'hk02328', symbol: '中国财险', name: 'China P&C', market: '港股', exchange: 'HK', code: 'hk02328' },
  { id: 'hk06030', symbol: '中信证券(港)', name: 'CITIC Securities (HK)', market: '港股', exchange: 'HK', code: 'hk06030' },
  { id: 'hk06837', symbol: '海通证券(港)', name: 'Haitong Securities (HK)', market: '港股', exchange: 'HK', code: 'hk06837' }
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
      timeout: 5000,
      responseType: 'arraybuffer'
    });
    
    // 处理GBK编码
    const iconv = require('iconv-lite');
    const buffer = Buffer.from(response.data);
    const gbkString = iconv.decode(buffer, 'GBK');
    
    const stockData = parseTencentStock(gbkString);
    if (!stockData || stockData.price === 0) {
      return null;
    }
    
    return stockData;
  } catch (error) {
    console.error(`获取股票 ${code} 失败:`, error.message);
    return null;
  }
}

// 获取所有股票价格 - 批量请求
export async function getPrices() {
  const results = [];
  
  // 腾讯API支持批量查询，用逗号分隔
  const codes = SUPPORTED_STOCKS.map(s => s.code).join(',');
  const url = `${TENCENT_API}${codes}`;
  
  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      responseType: 'arraybuffer'
    });
    
    // 处理GBK编码
    const iconv = require('iconv-lite');
    const buffer = Buffer.from(response.data);
    const rawData = iconv.decode(buffer, 'GBK');
    
    // 解析批量返回的数据
    // 格式: v_sh600519="100~股票名称~代码~当前价格~昨收~..."; v_sz000858="..."
    const stockDataMap = {};
    
    // 使用正则提取所有股票数据
    const regex = /v_([^=]+)="([^"]+)"/g;
    let match;
    while ((match = regex.exec(rawData)) !== null) {
      const code = match[1];
      const value = match[2];
      const parsed = parseTencentStock(`v_${code}="${value}"`);
      if (parsed && parsed.price > 0) {
        stockDataMap[code] = parsed;
      }
    }
    
    // 遍历支持的股票，匹配数据
    for (const stock of SUPPORTED_STOCKS) {
      const data = stockDataMap[stock.code];
      
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
      }
    }
    
  } catch (error) {
    console.error('批量获取股票失败，尝试逐个获取:', error.message);
    
    // 降级: 逐个获取
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
