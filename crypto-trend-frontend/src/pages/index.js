import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

const API_BASE = 'http://localhost:3030/api';

// 96只A股/港股股票
const STOCKS_CONFIG = [
  // A股 - 蓝筹股
  { id: 'sh600519', symbol: '贵州茅台', name: 'Kweichow Moutai', market: 'A股' },
  { id: 'sh600036', symbol: '招商银行', name: 'China Merchants Bank', market: 'A股' },
  { id: 'sh600030', symbol: '中信证券', name: 'CITIC Securities', market: 'A股' },
  { id: 'sh601318', symbol: '中国平安', name: 'Ping An', market: 'A股' },
  { id: 'sh601888', symbol: '中国中铁', name: 'China Railway', market: 'A股' },
  { id: 'sh601398', symbol: '工商银行', name: 'ICBC', market: 'A股' },
  { id: 'sh600028', symbol: '中国石化', name: 'Sinopec', market: 'A股' },
  { id: 'sh600016', symbol: '民生银行', name: 'China Minsheng Bank', market: 'A股' },
  { id: 'sh600000', symbol: '浦发银行', name: 'Shanghai Pudong Bank', market: 'A股' },
  { id: 'sh601857', symbol: '中国石油', name: 'PetroChina', market: 'A股' },
  // A股 - 科技
  { id: 'sz002230', symbol: '科大讯飞', name: 'iFlytek', market: 'A股' },
  { id: 'sz002415', symbol: '海康威视', name: 'Hikvision', market: 'A股' },
  { id: 'sz300059', symbol: '东方财富', name: 'East Money', market: 'A股' },
  { id: 'sh688041', symbol: '芯原股份', name: 'Chips & Media', market: 'A股' },
  { id: 'sz002594', symbol: '比亚迪', name: 'BYD', market: 'A股' },
  { id: 'sz002714', symbol: '牧原股份', name: 'Muyuan Food', market: 'A股' },
  { id: 'sz300014', symbol: '亿纬锂能', name: 'EVE Energy', market: 'A股' },
  { id: 'sz000858', symbol: '五粮液', name: 'Wuliangye', market: 'A股' },
  { id: 'sz000596', symbol: '古井贡酒', name: 'Gujing Gong', market: 'A股' },
  { id: 'sz000869', symbol: '张裕A', name: 'Changyu', market: 'A股' },
  // A股 - 医药
  { id: 'sh600276', symbol: '恒瑞医药', name: 'Hengrui', market: 'A股' },
  { id: 'sz000538', symbol: '云南白药', name: 'Yunnan Baiyao', market: 'A股' },
  { id: 'sz000423', symbol: '同仁堂', name: 'Tong Ren Tang', market: 'A股' },
  { id: 'sz300015', symbol: '爱尔眼科', name: 'Aier Eye', market: 'A股' },
  { id: 'sz300122', symbol: '智飞生物', name: 'Zhifei Bio', market: 'A股' },
  { id: 'sz300142', symbol: '沃森生物', name: 'Wosin Bio', market: 'A股' },
  { id: 'sz300347', symbol: '泰格医药', name: 'Tigermed', market: 'A股' },
  { id: 'sz300750', symbol: '宁德时代', name: 'CATL', market: 'A股' },
  // A股 - 金融
  { id: 'sz000001', symbol: '平安银行', name: 'Ping An Bank', market: 'A股' },
  { id: 'sh601988', symbol: '中国银行', name: 'Bank of China', market: 'A股' },
  { id: 'sh600585', symbol: '海螺水泥', name: 'Conch Cement', market: 'A股' },
  { id: 'sh600309', symbol: '万华化学', name: 'Wanhua', market: 'A股' },
  { id: 'sh600547', symbol: '山东黄金', name: 'Shandong Gold', market: 'A股' },
  { id: 'sh600900', symbol: '长江电力', name: 'China Power', market: 'A股' },
  { id: 'sh601111', symbol: '中国铁建', name: 'China CRCC', market: 'A股' },
  { id: 'sh600009', symbol: '上海机场', name: 'Shanghai Airport', market: 'A股' },
  { id: 'sh600018', symbol: '上港集团', name: 'Shanghai Port', market: 'A股' },
  { id: 'sh600031', symbol: '三一重工', name: 'Sany', market: 'A股' },
  { id: 'sh600150', symbol: '中国船舶', name: 'China Shipbuilding', market: 'A股' },
  { id: 'sh600050', symbol: '中国联通', name: 'China Unicom', market: 'A股' },
  { id: 'sz000333', symbol: '美的集团', name: 'Midea Group', market: 'A股' },
  { id: 'sh600690', symbol: '青岛海尔', name: 'Haier', market: 'A股' },
  { id: 'sz000651', symbol: '格力电器', name: 'Gree', market: 'A股' },
  { id: 'sz000002', symbol: '万科A', name: 'Vanke', market: 'A股' },
  // 港股
  { id: 'hk00700', symbol: '腾讯控股', name: 'Tencent', market: '港股' },
  { id: 'hk09988', symbol: '阿里巴巴', name: 'Alibaba', market: '港股' },
  { id: 'hk01810', symbol: '小米集团', name: 'Xiaomi', market: '港股' },
  { id: 'hk09618', symbol: '京东集团', name: 'JD.com', market: '港股' },
  { id: 'hk00939', symbol: '建设银行', name: 'CCB', market: '港股' },
  { id: 'hk01398', symbol: '工商银行', name: 'ICBC', market: '港股' },
  { id: 'hk03988', symbol: '中国银行', name: 'BOC', market: '港股' },
  { id: 'hk00011', symbol: '恒生银行', name: 'Hang Seng Bank', market: '港股' },
  { id: 'hk02318', symbol: '中国平安', name: 'Ping An', market: '港股' },
  { id: 'hk02628', symbol: '中国人寿', name: 'China Life', market: '港股' },
  { id: 'hk02328', symbol: '中国财险', name: 'China P&C', market: '港股' },
  { id: 'hk00981', symbol: '中移动', name: 'China Mobile', market: '港股' },
  { id: 'hk00175', symbol: '吉利汽车', name: 'Geely Auto', market: '港股' },
  { id: 'hk00267', symbol: '中国铁建', name: 'China Railway', market: '港股' },
  { id: 'hk00690', symbol: '中国中铁', name: 'China Rail', market: '港股' },
  { id: 'hk00667', symbol: '中国中铁', name: 'China Rail', market: '港股' },
  { id: 'hk00388', symbol: '港交所', name: 'HKEX', market: '港股' },
  { id: 'hk06030', symbol: '中信证券', name: 'CITIC Securities', market: '港股' },
  { id: 'hk06837', symbol: '海通证券', name: 'Haitong', market: '港股' },
  { id: 'hk03690', symbol: '海尔智家', name: 'Haier Smart', market: '港股' },
  { id: 'hk02331', symbol: '李宁', name: 'Li-Ning', market: '港股' },
  { id: 'hk02020', symbol: '安踏体育', name: 'Anta Sports', market: '港股' },
  { id: 'hk00386', symbol: '中国石化', name: 'Sinopec', market: '港股' },
  { id: 'hk01171', symbol: '华能电力', name: 'Huaneng Power', market: '港股' },
  { id: 'hk01928', symbol: '中国中车', name: 'CRRC', market: '港股' },
  { id: 'hk00027', symbol: '银河证券', name: 'Galaxy Securities', market: '港股' },
  { id: 'hk09961', symbol: '快手', name: 'Kuaishou', market: '港股' },
  { id: 'hk01024', symbol: '快手', name: 'Kuaishou', market: '港股' },
  { id: 'hk00017', symbol: '新鸿基', name: 'Sun Hung Kai', market: '港股' },
  { id: 'hk00016', symbol: '新鸿基', name: 'SHK', market: '港股' },
  { id: 'hk00012', symbol: '恒基地产', name: 'Henderson Land', market: '港股' },
  // 更多A股
  { id: 'sh601668', symbol: '中国中铁', name: 'China Railway', market: 'A股' },
  { id: 'sh601166', symbol: '兴业银行', name: 'Industrial Bank', market: 'A股' },
  { id: 'sh600104', symbol: '上汽集团', name: 'SAIC', market: 'A股' },
  { id: 'sh600887', symbol: '伊利股份', name: 'Yili', market: 'A股' },
  { id: 'sh601012', symbol: '隆基绿能', name: 'LONGi', market: 'A股' },
  { id: 'sh688981', symbol: '中芯国际', name: 'SMIC', market: 'A股' },
  { id: 'sh600089', symbol: '特变电工', name: 'TBEA', market: 'A股' },
  { id: 'sh600570', symbol: '恒生电子', name: 'Hundsun', market: 'A股' },
  { id: 'sh600588', symbol: '用友网络', name: 'Yonyou', market: 'A股' },
  { id: 'sz000725', symbol: '京东方A', name: 'BOE', market: 'A股' },
  { id: 'sz000100', symbol: 'TCL科技', name: 'TCL', market: 'A股' },
  { id: 'sz002475', symbol: '立讯精密', name: 'Luxshare', market: 'A股' },
  { id: 'sz002456', symbol: '欧菲光', name: 'Ofilm', market: 'A股' },
  { id: 'sz300433', symbol: '蓝思科技', name: 'Lens Technology', market: 'A股' },
  { id: 'sz300498', symbol: '中科曙光', name: 'Sugon', market: 'A股' },
  { id: 'sz300212', symbol: '易瑞生物', name: 'Bioeasy', market: 'A股' },
  { id: 'sz300033', symbol: '同花顺', name: 'iFinD', market: 'A股' },
];

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [signalFilter, setSignalFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // 自选股
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockFavorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // 价格提醒
  const [alerts, setAlerts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockAlerts');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [showAlertModal, setShowAlertModal] = useState(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  
  // 持仓管理
  const [portfolio, setPortfolio] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockPortfolio');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showPortfolioModal, setShowPortfolioModal] = useState(null);
  const [portfolioQty, setPortfolioQty] = useState('');
  const [portfolioCost, setPortfolioCost] = useState('');
  
  // 股票对比
  const [compareList, setCompareList] = useState([]);

  // 保存自选股到localStorage
  useEffect(() => {
    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // 保存提醒到localStorage
  useEffect(() => {
    localStorage.setItem('stockAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // 保存持仓到localStorage
  useEffect(() => {
    localStorage.setItem('stockPortfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // 保存主题
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleFavorite = (stockId) => {
    setFavorites(prev => 
      prev.includes(stockId) 
        ? prev.filter(id => id !== stockId)
        : [...prev, stockId]
    );
  };

  const openAlertModal = (stock) => {
    setShowAlertModal(stock);
    setAlertPrice(stock.price ? stock.price.toFixed(2) : '');
    setAlerts(stock.id) ? setAlertType(alerts[stock.id].type) : setAlertType('above');
  };

  const saveAlert = () => {
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) return;
    
    setAlerts(prev => ({
      ...prev,
      [showAlertModal.id]: { price, type: alertType, triggered: false }
    }));
    setShowAlertModal(null);
  };

  const deleteAlert = (stockId) => {
    setAlerts(prev => {
      const newAlerts = Object.assign({}, prev);
      delete newAlerts[stockId];
      return newAlerts;
    });
  };

  const addToPortfolio = (stock) => {
    setShowPortfolioModal(stock);
    const existing = portfolio.find(p => p.id === stock.id);
    if (existing) {
      setPortfolioQty(existing.qty.toString());
      setPortfolioCost(existing.cost.toString());
    } else {
      setPortfolioQty('');
      setPortfolioCost(stock.price ? stock.price.toFixed(2) : '');
    }
  };

  const savePortfolio = () => {
    const qty = parseFloat(portfolioQty);
    const cost = parseFloat(portfolioCost);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) return;
    
    setPortfolio(prev => {
      const existing = prev.find(p => p.id === showPortfolioModal.id);
      if (existing) {
        return prev.map(p => p.id === showPortfolioModal.id ? Object.assign({}, p, { qty, cost }) : p);
      }
      return [...prev, { id: showPortfolioModal.id, symbol: showPortfolioModal.symbol, name: showPortfolioModal.name, market: showPortfolioModal.market, qty, cost }];
    });
    setShowPortfolioModal(null);
  };

  const removeFromPortfolio = (stockId) => {
    setPortfolio(prev => prev.filter(p => p.id !== stockId));
  };

  const toggleCompare = (stock) => {
    if (compareList.find(s => s.id === stock.id)) {
      setCompareList(prev => prev.filter(s => s.id !== stock.id));
    } else if (compareList.length < 3) {
      setCompareList(prev => [...prev, stock]);
    }
  };

  const portfolioStats = useMemo(() => {
    if (!portfolio.length || !stocks.length) return { totalValue: 0, totalCost: 0, pnl: 0, pnlPercent: 0 };
    
    let totalValue = 0;
    let totalCost = 0;
    
    portfolio.forEach(p => {
      const stock = stocks.find(s => s.id === p.id);
      if (stock) {
        totalValue += stock.price * p.qty;
        totalCost += p.cost * p.qty;
      }
    });
    
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    
    return { totalValue, totalCost, pnl, pnlPercent };
  }, [portfolio, stocks]);

  const fetchPrices = async () => {
    try {
      const res = await fetch(API_BASE + '/crypto/prices');
      const data = await res.json();
      
      const merged = STOCKS_CONFIG.map(config => {
        const stockData = data.find(s => s.id === config.id);
        return {
          id: config.id,
          symbol: config.symbol,
          name: config.name,
          market: config.market,
          price: stockData ? stockData.price : 0,
          change24h: stockData ? stockData.change24h : 0,
          signal: stockData ? stockData.signal : { signal: 'HOLD', reason: '数据获取中' }
        };
      });
      
      setStocks(merged);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal) => {
    if (!signal) return '#8c8c8c';
    const s = signal.signal || signal;
    if (s.includes && s.includes('BUY')) return '#52c41a';
    if (s.includes && s.includes('SELL')) return '#ff4d4f';
    return '#faad14';
  };

  const getSignalText = (signal) => {
    if (!signal) return '分析中';
    return signal.signal || signal;
  };

  const formatPrice = (price) => {
    if (!price) return '--';
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const filteredStocks = useMemo(() => {
    let result = stocks.slice();
    
    if (activeTab !== 'all') {
      result = result.filter(s => s.market === activeTab);
    }
    
    if (signalFilter !== 'all') {
      if (signalFilter === 'buy') {
        result = result.filter(s => s.signal && s.signal.signal && s.signal.signal.includes('BUY'));
      } else if (signalFilter === 'sell') {
        result = result.filter(s => s.signal && s.signal.signal && s.signal.signal.includes('SELL'));
      } else if (signalFilter === 'hold') {
        result = result.filter(s => s.signal && s.signal.signal === 'HOLD');
      }
    }
    
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(keyword) ||
        s.name.toLowerCase().includes(keyword) ||
        s.id.toLowerCase().includes(keyword)
      );
    }
    
    if (sortBy === 'price_asc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'price_desc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'change_asc') result.sort((a, b) => b.change24h - a.change24h);
    if (sortBy === 'change_desc') result.sort((a, b) => a.change24h - b.change24h);
    if (sortBy === 'name') result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    return result;
  }, [stocks, activeTab, signalFilter, search, sortBy]);

  const stats = useMemo(() => {
    const buy = stocks.filter(s => s.signal && s.signal.signal && s.signal.signal.includes('BUY')).length;
    const sell = stocks.filter(s => s.signal && s.signal.signal && s.signal.signal.includes('SELL')).length;
    const hold = stocks.length - buy - sell;
    const avgChange = stocks.length > 0 
      ? stocks.reduce((sum, s) => sum + (s.change24h || 0), 0) / stocks.length 
      : 0;
    return { buy, sell, hold, total: stocks.length, avgChange };
  }, [stocks]);

  const bgColor = darkMode ? '#0f172a' : '#f8fafc';
  const cardBg = darkMode ? 'rgba(30, 41, 59, 0.6)' : 'white';
  const textColor = darkMode ? '#f1f5f9' : '#1e293b';
  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <>
      <Head>
        <title>📈 A股/港股趋势信号</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        color: textColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <header style={{
          background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid ' + borderColor,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Stock Signal Pro
                  </h1>
                  <p style={{ fontSize: '0.75rem', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>A股 · 港股 · 实时信号</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '9999px', fontSize: '0.7rem', color: '#4ade80' }}>
                    🟢 买入 {stats.buy}
                  </span>
                  <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '9999px', fontSize: '0.7rem', color: '#facc15' }}>
                    🟡 持有 {stats.hold}
                  </span>
                  <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '9999px', fontSize: '0.7rem', color: '#f87171' }}>
                    🔴 卖出 {stats.sell}
                  </span>
                </div>
                
                <button onClick={fetchPrices} style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}>
                  🔄 刷新
                </button>
                
                <button onClick={() => setDarkMode(!darkMode)} style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.1)',
                  color: textColor,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  {darkMode ? '🌙' : '☀️'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          {/* 统计面板 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: cardBg, borderRadius: '12px', padding: '1rem', border: '1px solid ' + borderColor }}>
              <p style={{ fontSize: '0.7rem', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 0 0.25rem 0' }}>平均涨跌幅</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: stats.avgChange >= 0 ? '#4ade80' : '#f87171' }}>
                {stats.avgChange >= 0 ? '↑' : '↓'} {Math.abs(stats.avgChange).toFixed(2)}%
              </p>
            </div>
            <div style={{ background: cardBg, borderRadius: '12px', padding: '1rem', border: '1px solid ' + borderColor }}>
              <p style={{ fontSize: '0.7rem', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 0 0.25rem 0' }}>上涨股票</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#4ade80' }}>
                {stocks.filter(s => s.change24h > 0).length}
              </p>
            </div>
            <div style={{ background: cardBg, borderRadius: '12px', padding: '1rem', border: '1px solid ' + borderColor }}>
              <p style={{ fontSize: '0.7rem', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 0 0.25rem 0' }}>下跌股票</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#f87171' }}>
                {stocks.filter(s => s.change24h < 0).length}
              </p>
            </div>
            <div style={{ background: cardBg, borderRadius: '12px', padding: '1rem', border: '1px solid ' + borderColor }}>
              <p style={{ fontSize: '0.7rem', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 0 0.25rem 0' }}>持仓盈亏</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: portfolioStats.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                {portfolioStats.pnl >= 0 ? '↑' : '↓'} ¥{Math.abs(portfolioStats.pnl).toFixed(0)}
              </p>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div style={{ 
            background: cardBg, 
            borderRadius: '12px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            border: '1px solid ' + borderColor
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="搜索股票代码、名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '0.5rem 1rem',
                  background: darkMode ? '#0f172a' : '#f1f5f9',
                  border: '1px solid ' + borderColor,
                  borderRadius: '8px',
                  color: textColor,
                  fontSize: '0.9rem'
                }}
              />
              
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: darkMode ? '#0f172a' : '#f1f5f9',
                  border: '1px solid ' + borderColor,
                  borderRadius: '8px',
                  color: textColor,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">全部市场</option>
                <option value="A股">A股</option>
                <option value="港股">港股</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: darkMode ? '#0f172a' : '#f1f5f9',
                  border: '1px solid ' + borderColor,
                  borderRadius: '8px',
                  color: textColor,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="default">默认排序</option>
                <option value="price_asc">价格从高到低</option>
                <option value="price_desc">价格从低到高</option>
                <option value="change_asc">涨幅从高到低</option>
                <option value="change_desc">涨幅从低到高</option>
                <option value="name">名称排序</option>
              </select>
              
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: darkMode ? '#0f172a' : '#f1f5f9',
                  border: '1px solid ' + borderColor,
                  borderRadius: '8px',
                  color: textColor,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">全部信号</option>
                <option value="buy">买入信号</option>
                <option value="hold">持有信号</option>
                <option value="sell">卖出信号</option>
              </select>
            </div>
            
            {/* 快捷筛选 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSignalFilter('buy')}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: signalFilter === 'buy' ? '#52c41a' : 'rgba(82, 196, 26, 0.1)',
                  color: signalFilter === 'buy' ? 'white' : '#52c41a',
                  border: '1px solid #52c41a',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🚀 涨幅榜
              </button>
              <button
                onClick={() => setSignalFilter('sell')}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: signalFilter === 'sell' ? '#ff4d4f' : 'rgba(255, 77, 79, 0.1)',
                  color: signalFilter === 'sell' ? 'white' : '#ff4d4f',
                  border: '1px solid #ff4d4f',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                📉 跌幅榜
              </button>
              {favorites.length > 0 && (
                <button
                  onClick={() => setSearch(favorites.join(','))}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#a78bfa',
                    border: '1px solid #a78bfa',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ⭐ 自选股 ({favorites.length})
                </button>
              )}
              {portfolio.length > 0 && (
                <button
                  onClick={() => setSearch(portfolio.map(function(p) { return p.id; }).join(','))}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  💰 持仓 ({portfolio.length})
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '1.25rem' }}>加载中...</p>
            </div>
          ) : (
            <>
              {/* 股票列表 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {filteredStocks.map(function(stock) {
                  return (
                    <div
                      key={stock.id}
                      style={{
                        background: cardBg,
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid ' + borderColor,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{stock.symbol}</span>
                            <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.375rem', background: stock.market === 'A股' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: stock.market === 'A股' ? '#60a5fa' : '#f87171', borderRadius: '4px' }}>
                              {stock.market}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: darkMode ? '#64748b' : '#94a3b8', margin: '0.25rem 0 0 0' }}>{stock.name}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>¥{formatPrice(stock.price)}</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0.25rem 0 0 0', color: stock.change24h >= 0 ? '#4ade80' : '#f87171' }}>
                            {stock.change24h >= 0 ? '↑' : '↓'} {Math.abs(stock.change24h).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid ' + borderColor }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          background: getSignalColor(stock.signal) + '20', 
                          color: getSignalColor(stock.signal),
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getSignalText(stock.signal)}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={function(e) { e.stopPropagation(); toggleFavorite(stock.id); }}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              fontSize: '1rem',
                              cursor: 'pointer'
                            }}
                            title={favorites.includes(stock.id) ? '取消自选' : '加入自选'}
                          >
                            {favorites.includes(stock.id) ? '⭐' : '☆'}
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); openAlertModal(stock); }}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              fontSize: '1rem',
                              cursor: 'pointer'
                            }}
                            title="价格提醒"
                          >
                            {alerts[stock.id] ? '🔔' : '🔕'}
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); addToPortfolio(stock); }}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              fontSize: '1rem',
                              cursor: 'pointer'
                            }}
                            title="添加持仓"
                          >
                            {portfolio.find(function(p) { return p.id === stock.id; }) ? '💰' : '💵'}
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); toggleCompare(stock); }}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              fontSize: '1rem',
                              cursor: 'pointer'
                            }}
                            title="对比"
                          >
                            {compareList.find(function(s) { return s.id === stock.id; }) ? '📊' : '📈'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 底部信息 */}
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: darkMode ? '#64748b' : '#94a3b8' }}>
                  <span>🕐</span>
                  <span>数据来源: 腾讯财经</span>
                  <span>•</span>
                  <span>每30秒刷新</span>
                  {lastUpdate ? <><span>•</span><span>{lastUpdate.toLocaleTimeString()}</span></> : null}
                </div>
                <div style={{ fontSize: '0.7rem', color: darkMode ? '#475569' : '#94a3b8' }}>⚠️ 投资有风险，入市需谨慎</div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* 价格提醒弹窗 */}
      {showAlertModal ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={function() { setShowAlertModal(null); }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(255,255,255,0.1)'
          }} onClick={function(e) { e.stopPropagation(); }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fbbf24' }}>🔔 价格提醒</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              {showAlertModal.symbol} - {showAlertModal.name}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                提醒价格
              </label>
              <input
                type="number"
                step="0.01"
                value={alertPrice}
                onChange={function(e) { setAlertPrice(e.target.value); }}
                placeholder="输入价格"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                提醒类型
              </label>
              <select
                value={alertType}
                onChange={function(e) { setAlertType(e.target.value); }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <option value="above">高于价格提醒</option>
                <option value="below">低于价格提醒</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={saveAlert}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                保存提醒
              </button>
              {alerts[showAlertModal.id] ? (
                <button
                  onClick={function() { deleteAlert(showAlertModal.id); }}
                  style={{
                    padding: '0.75rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  删除
                </button>
              ) : null}
              <button
                onClick={function() { setShowAlertModal(null); }}
                style={{
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 持仓管理弹窗 */}
      {showPortfolioModal ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={function() { setShowPortfolioModal(null); }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }} onClick={function(e) { e.stopPropagation(); }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#a78bfa' }}>💰 添加持仓</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              {showPortfolioModal.symbol} - {showPortfolioModal.name}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                持仓数量
              </label>
              <input
                type="number"
                step="1"
                value={portfolioQty}
                onChange={function(e) { setPortfolioQty(e.target.value); }}
                placeholder="输入股数"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                成本价 (每股)
              </label>
              <input
                type="number"
                step="0.01"
                value={portfolioCost}
                onChange={function(e) { setPortfolioCost(e.target.value); }}
                placeholder="输入成本价"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={savePortfolio}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                保存持仓
              </button>
              {portfolio.find(function(p) { return p.id === showPortfolioModal.id; }) ? (
                <button
                  onClick={function() { removeFromPortfolio(showPortfolioModal.id); setShowPortfolioModal(null); }}
                  style={{
                    padding: '0.75rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  删除
                </button>
              ) : null}
              <button
                onClick={function() { setShowPortfolioModal(null); }}
                style={{
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
