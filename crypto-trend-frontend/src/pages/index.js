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
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const [pricesRes, signalsRes] = await Promise.all([
        fetch(`${API_BASE}/crypto/prices`),
        fetch(`${API_BASE}/signals`)
      ]);
      
      if (!pricesRes.ok) throw new Error('API Error');
      
      const pricesData = await pricesRes.json();
      const signalsData = await signalsRes.json();
      
      const signalsMap = {};
      signalsData.forEach(s => {
        signalsMap[s.stock.id] = s.signal;
      });
      
      const mergedData = pricesData.map(stock => ({
        ...stock,
        signal: signalsMap[stock.id] || { signal: 'HOLD', reason: '分析中' }
      }));
      
      setStocks(mergedData);
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

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredStocks.map(stock => {
                const signal = stock.signal || { signal: 'HOLD', reason: '分析中' };
                const colors = getSignalColor(signal.signal);
                const isUp = stock.change24h >= 0;
                
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
    </>
  );
}
