import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

const API_BASE = 'http://localhost:3002/api';

// 模拟数据
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
  const [useMock, setUseMock] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);

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
      setUseMock(false);
    } catch (error) {
      console.log('使用模拟数据', error.message);
      const mergedMock = MOCK_DATA.map(stock => ({
        ...stock,
        signal: MOCK_SIGNALS[stock.id] || { signal: 'HOLD', reason: '分析中' }
      }));
      setStocks(mergedMock);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = useMemo(() => {
    if (activeTab === 'all') return stocks;
    return stocks.filter(s => s.market === activeTab);
  }, [stocks, activeTab]);

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
    return { buy, sell, hold, total: stocks.length };
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
        {/* Header */}
        <header style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '9999px', fontSize: '0.75rem', color: '#4ade80' }}>
                    买入 {stats.buy}
                  </span>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '9999px', fontSize: '0.75rem', color: '#facc15' }}>
                    持有 {stats.hold}
                  </span>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '9999px', fontSize: '0.75rem', color: '#f87171' }}>
                    卖出 {stats.sell}
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
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <span>🔄</span> 刷新
                </button>
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'all', label: '全部', count: stocks.length },
              { key: 'A股', label: 'A股', count: stocks.filter(s => s.market === 'A股').length },
              { key: '港股', label: '港股', count: stocks.filter(s => s.market === '港股').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.key ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p style={{ color: '#94a3b8' }}>加载中...</p>
            </div>
          )}

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredStocks.map(stock => {
                const signal = stock.signal || { signal: 'HOLD', reason: '分析中' };
                const colors = getSignalColor(signal.signal);
                const isUp = stock.change24h >= 0;
                
                return (
                  <div 
                    key={stock.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${colors.border}40`,
                      borderRadius: '16px',
                      padding: '1.25rem',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px ${colors.border}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.25rem 0.75rem',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: colors.text,
                      textTransform: 'uppercase'
                    }}>
                      {signal.signal}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stock.symbol}</span>
                        <span style={{ 
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          background: stock.market === 'A股' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                          color: stock.market === 'A股' ? '#fca5a5' : '#93c5fd'
                        }}>
                          {stock.market}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{stock.name}</p>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                        {stock.market === '港股' ? 'HK$' : '¥'}{formatPrice(stock.price)}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{isUp ? '📈' : '📉'}</span>
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600',
                        color: isUp ? '#4ade80' : '#f87171'
                      }}>
                        {isUp ? '+' : ''}{stock.change24h?.toFixed(2) || '0.00'}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', margin: 0 }}>
                      💡 {signal.reason || '分析中...'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(30, 41, 59, 0.4)', 
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>🕐</span>
              <span>数据来源: 腾讯财经</span>
              <span>•</span>
              <span>每30秒自动刷新</span>
              {lastUpdate && (
                <>
                  <span>•</span>
                  <span>最后更新: {lastUpdate.toLocaleTimeString()}</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
              ⚠️ 投资有风险，入市需谨慎。本网站仅供学习参考。
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
