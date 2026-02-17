import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { createChart } from 'lightweight-charts';

const API_BASE = 'http://localhost:3030/api';

const MOCK_DATA = [
  { id: 'sh600519', symbol: '贵州茅台', name: 'Kweichow Moutai', market: 'A股', price: 1486.6, change24h: 0 },
  { id: 'sh600036', symbol: '招商银行', name: 'China Merchants Bank', market: 'A股', price: 38.99, change24h: 0 },
  { id: 'sz000858', symbol: '五粮液', name: 'Wuliangye Yibin', market: 'A股', price: 106.06, change24h: 1.38 },
  { id: 'hk00700', symbol: '腾讯控股', name: 'Tencent', market: '港股', price: 533, change24h: 0.19 }
];

const MOCK_SIGNALS = {
  'sh600519': { signal: 'HOLD', reason: '波动较小' },
  'sz000858': { signal: 'BUY', reason: '涨幅超过1%' },
  'hk00700': { signal: 'HOLD', reason: '波动较小' }
};

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [signalFilter, setSignalFilter] = useState('all');
  const [selectedStock, setSelectedStock] = useState(null);
  const [klineData, setKlineData] = useState(null);
  const [klineLoading, setKlineLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockFavorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
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
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Portfolio state
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

  // Compare state
  const [compareStocks, setCompareStocks] = useState([]);

  const toggleCompare = (stock, e) => {
    e.stopPropagation();
    setCompareStocks(prev => {
      if (prev.find(s => s.id === stock.id)) {
        return prev.filter(s => s.id !== stock.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, stock];
    });
  };

  // Save portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('stockPortfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const addToPortfolio = (stock, e) => {
    e.stopPropagation();
    setShowPortfolioModal(stock);
    const existing = portfolio.find(p => p.id === stock.id);
    if (existing) {
      setPortfolioQty(existing.qty.toString());
      setPortfolioCost(existing.cost.toString());
    } else {
      setPortfolioQty('');
      setPortfolioCost(stock.price?.toFixed(2) || '');
    }
  };

  const savePortfolio = () => {
    const qty = parseFloat(portfolioQty);
    const cost = parseFloat(portfolioCost);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) return;
    
    setPortfolio(prev => {
      const existing = prev.find(p => p.id === showPortfolioModal.id);
      if (existing) {
        return prev.map(p => p.id === showPortfolioModal.id ? { ...p, qty, cost } : p);
      }
      return [...prev, { id: showPortfolioModal.id, symbol: showPortfolioModal.symbol, name: showPortfolioModal.name, market: showPortfolioModal.market, qty, cost }];
    });
    setShowPortfolioModal(null);
  };

  const removeFromPortfolio = (stockId, e) => {
    e.stopPropagation();
    setPortfolio(prev => prev.filter(p => p.id !== stockId));
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
    
    return {
      totalValue,
      totalCost,
      pnl: totalValue - totalCost,
      pnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0
    };
  }, [portfolio, stocks]);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('stockAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Check price alerts when stocks change
  useEffect(() => {
    if (!stocks.length || typeof window === 'undefined') return;
    
    Object.entries(alerts).forEach(([stockId, alert]) => {
      const stock = stocks.find(s => s.id === stockId);
      if (!stock) return;
      
      const triggered = 
        (alert.type === 'above' && stock.price >= alert.price) ||
        (alert.type === 'below' && stock.price <= alert.price);
      
      if (triggered && !alert.triggered) {
        // Update alert to prevent repeated notifications
        setAlerts(prev => ({
          ...prev,
          [stockId]: { ...alert, triggered: true }
        }));
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('📢 价格提醒', {
            body: `${stock.symbol} 当前价格 ${stock.market === '港股' ? 'HK$' : '¥'}${stock.price.toFixed(2)}，${alert.type === 'above' ? '高于' : '低于'}设置的 ¥${alert.price}`,
            icon: '📊'
          });
        }
        
        // Also show in-app alert
        alert(`${stock.symbol} 达到提醒价格! 当前: ${stock.market === '港股' ? 'HK$' : '¥'}${stock.price.toFixed(2)}`);
      }
    });
  }, [stocks]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleFavorite = (stockId, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(stockId) 
        ? prev.filter(id => id !== stockId)
        : [...prev, stockId]
    );
  };

  const openAlertModal = (stock, e) => {
    e.stopPropagation();
    setSelectedStock(stock);
    setShowAlertModal(stock);
    setAlertPrice(stock.price?.toFixed(2) || '');
    setAlerts(stock.id) ? setAlertType(alerts[stock.id].type) : setAlertType('above');
  };

  const saveAlert = () => {
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) return;
    
    setAlerts(prev => ({
      ...prev,
      [showAlertModal.id]: {
        price,
        type: alertType,
        triggered: false
      }
    }));
    setShowAlertModal(null);
  };

  const deleteAlert = (stockId, e) => {
    e.stopPropagation();
    setAlerts(prev => {
      const newAlerts = { ...prev };
      delete newAlerts[stockId];
      return newAlerts;
    });
  };

  const favoriteStocks = useMemo(() => 
    stocks.filter(s => favorites.includes(s.id)),
    [stocks, favorites]
  );

  const fetchPrices = async () => {
    try {
      const [pricesRes, signalsRes, sectorsRes] = await Promise.all([
        fetch(`${API_BASE}/crypto/prices`),
        fetch(`${API_BASE}/signals`),
        fetch(`${API_BASE}/sectors`)
      ]);
      
      if (!pricesRes.ok) throw new Error('API Error');
      
      const pricesData = await pricesRes.json();
      const signalsData = await signalsRes.json();
      const sectorsData = await sectorsRes.json();
      
      const signalsMap = {};
      signalsData.forEach(s => {
        signalsMap[s.stock.id] = s.signal;
      });
      
      const mergedData = pricesData.map(stock => ({
        ...stock,
        signal: signalsMap[stock.id] || { signal: 'HOLD', reason: '分析中' }
      }));
      
      setStocks(mergedData);
      setSectors(sectorsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.log('使用模拟数据', error.message);
      const mergedMock = MOCK_DATA.map(stock => ({
        ...stock,
        signal: MOCK_SIGNALS[stock.id] || { signal: 'HOLD', reason: '分析中' }
      }));
      setStocks(mergedMock);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch K-line when stock is selected
  useEffect(() => {
    if (!selectedStock) {
      setKlineData(null);
      return;
    }
    
    const fetchKline = async () => {
      setKlineLoading(true);
      try {
        const res = await fetch(`${API_BASE}/crypto/ohlc/${selectedStock.id}?days=30`);
        const data = await res.json();
        setKlineData(data);
      } catch (e) {
        console.error('K-line fetch error:', e);
        setKlineData(null);
      } finally {
        setKlineLoading(false);
      }
    };
    
    fetchKline();
  }, [selectedStock]);

  // Render chart when K-line data changes
  useEffect(() => {
    if (!klineData?.klines?.length || !chartContainerRef.current) return;
    
    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#1e293b' },
        textColor: '#94a3b8'
      },
      grid: {
        vertLines: { color: '#334155' },
        horzLines: { color: '#334155' }
      },
      crosshair: {
        mode: 1
      },
      rightPriceScale: {
        borderColor: '#334155'
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true
      }
    });
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });
    
    const data = klineData.klines.map(k => ({
      time: k.date,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close
    }));
    
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [klineData]);

  const filteredStocks = useMemo(() => {
    let result = [...stocks];
    
    if (activeTab !== 'all') {
      result = result.filter(s => s.market === activeTab);
    }
    
    if (signalFilter !== 'all') {
      if (signalFilter === 'buy') {
        result = result.filter(s => s.signal?.signal?.includes('BUY'));
      } else if (signalFilter === 'sell') {
        result = result.filter(s => s.signal?.signal?.includes('SELL'));
      } else if (signalFilter === 'hold') {
        result = result.filter(s => s.signal?.signal === 'HOLD');
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
    
    // Filter by selected sector
    if (selectedSector) {
      const sectorStocks = sectors.find(s => s.name === selectedSector);
      if (sectorStocks) {
        // Get stock IDs from sector
        const sectorNames = {
          '银行': ['sh600036','sh601988','sh601398','sh600016','sh600000','sz000001','hk00939','hk01398','hk03988','hk00011'],
          '保险': ['sh601318','hk02318','hk02628','hk02328'],
          '白酒': ['sh600519','sz000858','sz000596','sz000869'],
          '科技': ['hk00700','hk09988','hk01810','hk09618','sz002230','sz002415','sh688041','sz300059'],
          '医药': ['sh600276','sz000538','sz000423','sz300015','sz300122','sz300142','sz300347','sz300750'],
          '新能源': ['sz002594','sz002714','sz300014','hk00175'],
          '房地产': ['sz000002','hk00017','hk00016','hk00012'],
          '通信': ['sh600050','hk00981'],
          '基建': ['sh601888','sh601668','sh600031','sh600150','hk00267','hk00690','hk00667'],
          '券商': ['sh600030','hk00388','hk06030','hk06837'],
          '消费': ['sz000333','sh600690','sz000651','hk03690','hk02331','hk02020'],
          '能源': ['sh600028','sh601857','sh600309','sh600585','sh600547','hk00386'],
          '电力': ['sh600900','hk01171'],
          '物流': ['sh601111','sh600009','sh600018','hk01928','hk00027'],
          '传媒': ['hk09961','hk01024'],
          '服装': ['hk02020']
        };
        const sectorIds = sectorNames[selectedSector] || [];
        result = result.filter(s => sectorIds.includes(s.id));
      }
    }
    
    switch (sortBy) {
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'change_desc':
        result.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
        break;
      case 'change_asc':
        result.sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
        break;
      default:
        break;
    }
    
    return result;
  }, [stocks, activeTab, signalFilter, search, sortBy]);

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'STRONG_BUY': return { bg: '#052e16', border: '#22c55e', text: '#4ade80' };
      case 'BUY': return { bg: '#14532d', border: '#16a34a', text: '#86efac' };
      case 'HOLD': return { bg: '#713f12', border: '#ca8a04', text: '#fde047' };
      case 'SELL': return { bg: '#450a0a', border: '#dc2626', text: '#fca5a5' };
      case 'STRONG_SELL': return { bg: '#7f1d1d', border: '#b91c1c', text: '#f87171' };
      default: return { bg: '#1f2937', border: '#4b5563', text: '#9ca3af' };
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '--';
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const stats = useMemo(() => {
    const buy = stocks.filter(s => s.signal?.signal?.includes('BUY')).length;
    const sell = stocks.filter(s => s.signal?.signal?.includes('SELL')).length;
    const hold = stocks.length - buy - sell;
    const avgChange = stocks.length > 0 
      ? stocks.reduce((sum, s) => sum + (s.change24h || 0), 0) / stocks.length 
      : 0;
    return { buy, sell, hold, total: stocks.length, avgChange };
  }, [stocks]);

  return (
    <>
      <Head>
        <title>📈 A股/港股趋势信号</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f1f5f9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <header style={{
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
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
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>A股 · 港股 · 实时信号</p>
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
                
                <button 
                  onClick={fetchPrices}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  <span>🔄</span> 刷新
                </button>
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>平均涨跌幅</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: stats.avgChange >= 0 ? '#4ade80' : '#f87171' }}>
                {stats.avgChange >= 0 ? '↑' : '↓'} {Math.abs(stats.avgChange).toFixed(2)}%
              </p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>上涨股票</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#4ade80' }}>
                {stocks.filter(s => s.change24h > 0).length}
              </p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>下跌股票</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#f87171' }}>
                {stocks.filter(s => s.change24h < 0).length}
              </p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.25rem 0' }}>最高涨幅</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#4ade80' }}>
                ↑ {Math.max(...stocks.map(s => s.change24h || 0)).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Sector Heat Map */}
          {sectors.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem' }}>🌡️</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8' }}>板块涨跌</span>
                {selectedSector && (
                  <button
                    onClick={() => setSelectedSector(null)}
                    style={{
                      padding: '0.125rem 0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    清除筛选
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sectors.map(sector => {
                  const isPositive = sector.avgChange >= 0;
                  const intensity = Math.min(Math.abs(sector.avgChange) / 3, 1); // max at 3%
                  const bgColor = isPositive 
                    ? `rgba(34, 197, 94, ${0.1 + intensity * 0.4})`
                    : `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`;
                  const borderColor = isPositive ? '#22c55e' : '#ef4444';
                  const isSelected = selectedSector === sector.name;
                  
                  return (
                    <button
                      key={sector.name}
                      onClick={() => setSelectedSector(isSelected ? null : sector.name)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: bgColor,
                        border: isSelected ? `2px solid ${borderColor}` : `1px solid ${borderColor}40`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '70px'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isPositive ? '#4ade80' : '#f87171' }}>
                        {sector.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isPositive ? '#4ade80' : '#f87171' }}>
                        {isPositive ? '↑' : '↓'}{Math.abs(sector.avgChange).toFixed(2)}%
                      </span>
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                        {sector.count}只
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolio Summary */}
          {portfolio.length > 0 && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#a78bfa' }}>💰 我的持仓 ({portfolio.length}只)</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  持仓: ¥{portfolioStats.totalCost.toLocaleString()} | 
                  当前: ¥{portfolioStats.totalValue.toLocaleString()} | 
                  <span style={{ color: portfolioStats.pnl >= 0 ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                    {portfolioStats.pnl >= 0 ? '↑' : '↓'}¥{Math.abs(portfolioStats.pnl).toLocaleString()} ({portfolioStats.pnlPercent.toFixed(2)}%)
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {portfolio.map(p => {
                  const stock = stocks.find(s => s.id === p.id);
                  const currentValue = stock ? stock.price * p.qty : 0;
                  const costValue = p.cost * p.qty;
                  const pnl = currentValue - costValue;
                  const pnlPercent = (pnl / costValue) * 100;
                  
                  return (
                    <div key={p.id} style={{
                      padding: '0.375rem 0.625rem',
                      background: 'rgba(30, 41, 59, 0.6)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{p.symbol}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.qty}股</span>
                      <span style={{ fontSize: '0.7rem', color: pnl >= 0 ? '#4ade80' : '#f87171' }}>
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                      </span>
                      <button
                        onClick={(e) => removeFromPortfolio(p.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '0'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compare Panel */}
          {compareStocks.length > 0 && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#60a5fa' }}>📊 股票对比 ({compareStocks.length}/3)</span>
                <button
                  onClick={() => setCompareStocks([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  清除
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareStocks.length}, 1fr)`, gap: '1rem' }}>
                {compareStocks.map(stock => (
                  <div key={stock.id} style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{stock.name}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                      {stock.market === '港股' ? 'HK$' : '¥'}{stock.price?.toFixed(2)}
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: stock.change24h >= 0 ? '#4ade80' : '#f87171',
                      marginBottom: '0.5rem'
                    }}>
                      {stock.change24h >= 0 ? '+' : ''}{stock.change24h?.toFixed(2)}%
                    </div>
                    <button
                      onClick={(e) => toggleCompare(stock, e)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#f87171',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
              <input
                type="text"
                placeholder="搜索股票代码/名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem 0.625rem 2.5rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '0.875rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="default">默认排序</option>
              <option value="price_desc">价格从高到低</option>
              <option value="price_asc">价格从低到高</option>
              <option value="change_desc">涨幅从高到低</option>
              <option value="change_asc">涨幅从低到高</option>
            </select>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: '全部', count: stocks.length },
              { key: 'A股', label: 'A股', count: stocks.filter(s => s.market === 'A股').length },
              { key: '港股', label: '港股', count: stocks.filter(s => s.market === '港股').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.key ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
            
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />
            
            {[
              { key: 'all', label: '全部信号' },
              { key: 'buy', label: '🟢 买入' },
              { key: 'hold', label: '🟡 持有' },
              { key: 'sell', label: '🔴 卖出' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSignalFilter(filter.key)}
                style={{
                  padding: '0.5rem 1rem',
                  background: signalFilter === filter.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: '#94a3b8',
                  border: '1px solid',
                  borderColor: signalFilter === filter.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            共 {filteredStocks.length} 只股票 {search && `(搜索: "${search}")`}
          </p>

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p style={{ color: '#94a3b8' }}>加载中...</p>
            </div>
          )}

          {!loading && favoriteStocks.length > 0 && activeTab === 'all' && signalFilter === 'all' && !search && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⭐ 我的自选 ({favoriteStocks.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {favoriteStocks.map(stock => {
                  const signal = stock.signal || { signal: 'HOLD', reason: '分析中' };
                  const colors = getSignalColor(signal.signal);
                  const isUp = stock.change24h >= 0;
                  const isFav = favorites.includes(stock.id);
                  
                  return (
                    <div 
                      key={stock.id}
                      onClick={() => setSelectedStock(selectedStock?.id === stock.id ? null : stock)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: selectedStock?.id === stock.id ? `2px solid ${colors.border}` : `1px solid #fbbf2440`,
                        borderRadius: '16px',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <button
                        onClick={(e) => toggleFavorite(stock.id, e)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '1rem',
                          background: 'none',
                          border: 'none',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                      >
                        {isFav ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={(e) => openAlertModal(stock, e)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '2.5rem',
                          background: alerts[stock.id] ? 'rgba(251, 191, 36, 0.2)' : 'none',
                          border: 'none',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px'
                        }}
                        title={alerts[stock.id] ? `提醒: ${alerts[stock.type === 'above' ? '高于' : '低于'} ¥${alerts[stock.id].price}` : '设置价格提醒'}
                      >
                        {alerts[stock.id] ? '🔔' : '🔕'}
                      </button>
                      <button
                        onClick={(e) => addToPortfolio(stock, e)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '3.75rem',
                          background: portfolio.find(p => p.id === stock.id) ? 'rgba(139, 92, 246, 0.3)' : 'none',
                          border: 'none',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px'
                        }}
                        title={portfolio.find(p => p.id === stock.id) ? `持仓: ${portfolio.find(p => p.id === stock.id).qty}股` : '添加持仓'}
                      >
                        {portfolio.find(p => p.id === stock.id) ? '💰' : '💵'}
                      </button>
                      <button
                        onClick={(e) => toggleCompare(stock, e)}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '5rem',
                          background: compareStocks.find(s => s.id === stock.id) ? 'rgba(59, 130, 246, 0.3)' : 'none',
                          border: 'none',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px'
                        }}
                        title={compareStocks.find(s => s.id === stock.id) ? '取消对比' : '对比股票'}
                      >
                        {compareStocks.find(s => s.id === stock.id) ? '📊' : '📈'}
                      </button>
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        padding: '0.2rem 0.625rem',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: colors.text
                      }}>
                        {signal.signal}
                      </div>

                      <div style={{ marginBottom: '0.75rem', paddingRight: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{stock.symbol}</span>
                          <span style={{ padding: '0.1rem 0.375rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '600', background: stock.market === 'A股' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(37, 99, 235, 0.2)', color: stock.market === 'A股' ? '#fca5a5' : '#93c5fd' }}>
                            {stock.market}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>{stock.name}</p>
                      </div>

                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                          {stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.price)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem', background: isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>{isUp ? '📈' : '📉'}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isUp ? '#4ade80' : '#f87171' }}>
                          {isUp ? '+' : ''}{stock.change24h?.toFixed(2) || '0.00'}%
                        </span>
                      </div>

                      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>💡 {signal.reason || '分析中...'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredStocks.map(stock => {
                const signal = stock.signal || { signal: 'HOLD', reason: '分析中' };
                const colors = getSignalColor(signal.signal);
                const isUp = stock.change24h >= 0;
                const isFav = favorites.includes(stock.id);
                
                return (
                  <div 
                    key={stock.id}
                    onClick={() => setSelectedStock(selectedStock?.id === stock.id ? null : stock)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: selectedStock?.id === stock.id ? `2px solid ${colors.border}` : `1px solid ${colors.border}40`,
                      borderRadius: '16px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={(e) => toggleFavorite(stock.id, e)}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      {isFav ? '⭐' : '☆'}
                    </button>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.2rem 0.625rem',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: colors.text
                    }}>
                      {signal.signal}
                    </div>

                    <div style={{ marginBottom: '0.75rem', paddingRight: '4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{stock.symbol}</span>
                        <span style={{ padding: '0.1rem 0.375rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '600', background: stock.market === 'A股' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(37, 99, 235, 0.2)', color: stock.market === 'A股' ? '#fca5a5' : '#93c5fd' }}>
                          {stock.market}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>{stock.name}</p>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        {stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.price)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem', background: isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>{isUp ? '📈' : '📉'}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isUp ? '#4ade80' : '#f87171' }}>
                        {isUp ? '+' : ''}{stock.change24h?.toFixed(2) || '0.00'}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>💡 {signal.reason || '分析中...'}</p>
                    
                    {signal.rsi && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>RSI:</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: parseFloat(signal.rsi) < 35 ? '#4ade80' : parseFloat(signal.rsi) > 65 ? '#f87171' : '#fbbf24'
                        }}>
                          {signal.rsi}
                        </span>
                      </div>
                    )}

                    {selectedStock?.id === stock.id && (
                      <>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>开盘</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>{stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.open)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>最高</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: '#4ade80' }}>{stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.high)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>最低</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: '#f87171' }}>{stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.low)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0 0 0.125rem 0' }}>成交量</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>{(stock.volume / 10000).toFixed(1)}万</p>
                          </div>
                        </div>
                        
                        {/* K-Line Chart */}
                        {stock.market === 'A股' && (
                          <div style={{ marginTop: '1rem' }}>
                            {klineLoading ? (
                              <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <span style={{ fontSize: '1rem' }}>⏳</span>
                                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>加载K线数据...</p>
                              </div>
                            ) : klineData?.klines?.length > 0 ? (
                              <>
                                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>📊 30日K线</p>
                                <div ref={chartContainerRef} style={{ borderRadius: '8px', overflow: 'hidden' }} />
                              </>
                            ) : (
                              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.5rem 0' }}>暂无可用K线数据</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span>🕐</span>
              <span>数据来源: 腾讯财经</span>
              <span>•</span>
              <span>每30秒刷新</span>
              {lastUpdate && <><span>•</span><span>{lastUpdate.toLocaleTimeString()}</span></>}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569' }}>⚠️ 投资有风险，入市需谨慎</div>
          </div>
        </main>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
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
        }} onClick={() => setShowAlertModal(null)}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(255,255,255,0.1)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔔 价格提醒
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              {showAlertModal.symbol} - {showAlertModal.name}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              当前价格: {showAlertModal.market === '港股' ? 'HK$' : '¥'}{showAlertModal.price?.toFixed(2)}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                提醒类型
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
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
                <option value="above">高于此价格提醒</option>
                <option value="below">低于此价格提醒</option>
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                提醒价格
              </label>
              <input
                type="number"
                step="0.01"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
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
              {alerts[showAlertModal.id] && (
                <button
                  onClick={(e) => deleteAlert(showAlertModal.id, e)}
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
              )}
              <button
                onClick={() => setShowAlertModal(null)}
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
        )}
      )}

      {/* Portfolio Modal */}
      {showPortfolioModal && (
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
        }} onClick={() => setShowPortfolioModal(null)}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💰 添加持仓
            </h3>
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
                onChange={(e) => setPortfolioQty(e.target.value)}
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
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                成本价格
              </label>
              <input
                type="number"
                step="0.01"
                value={portfolioCost}
                onChange={(e) => setPortfolioCost(e.target.value)}
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
              <button
                onClick={() => setShowPortfolioModal(null)}
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
      )}
    </>
  );
}
