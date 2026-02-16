import { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE = 'http://localhost:3002/api';

// 模拟数据（当 API 不可用时）
const MOCK_DATA = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 97500, change24h: 2.34 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3250, change24h: 1.87 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 685, change24h: -0.45 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 195, change24h: 5.23 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 2.85, change24h: 3.12 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.98, change24h: -1.23 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.32, change24h: 4.56 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 7.25, change24h: 0.89 }
];

const MOCK_SIGNALS = {
  bitcoin: { signal: 'BUY', rsi: 42, ma7: 96000, ma25: 95000 },
  ethereum: { signal: 'BUY', rsi: 48, ma7: 3200, ma25: 3150 },
  solana: { signal: 'STRONG_BUY', rsi: 65, ma7: 190, ma25: 180 },
  ripple: { signal: 'HOLD', rsi: 55, ma7: 2.8, ma25: 2.75 }
};

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_BASE}/crypto/prices`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setCoins(data);
      setUseMock(false);
    } catch (error) {
      console.log('使用模拟数据');
      setCoins(MOCK_DATA);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // 每30秒刷新一次
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'STRONG_BUY': return '#52c41a';
      case 'BUY': return '#73d13d';
      case 'HOLD': return '#faad14';
      case 'SELL': return '#ff4d4f';
      case 'STRONG_SELL': return '#cf1322';
      default: return '#8c8c8c';
    }
  };

  const getSignalText = (signal) => {
    switch (signal) {
      case 'STRONG_BUY': return '强烈买入';
      case 'BUY': return '买入';
      case 'HOLD': return '持有';
      case 'SELL': return '卖出';
      case 'STRONG_SELL': return '强烈卖出';
      default: return '分析中';
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <>
      <Head>
        <title>📈 Crypto Trend - 加密货币趋势分析</title>
      </Head>
      <div style={{ minHeight: '100vh', background: '#0d1117', color: '#c9d1d9', padding: '1rem' }}>
        <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
              📈 Crypto Trend
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>
              {useMock ? '🔴 模拟数据' : '🟢 实时数据'}
              <button 
                onClick={fetchPrices}
                style={{ 
                  marginLeft: '1rem', 
                  padding: '0.25rem 0.75rem',
                  background: '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                刷新
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🚀 今日买卖信号</h2>
            <p style={{ color: '#8b949e', fontSize: '0.875rem' }}>
              基于 MA 和 RSI 指标分析
            </p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>加载中...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {coins.map(coin => {
                const signal = MOCK_SIGNALS[coin.id] || { signal: 'HOLD', rsi: 50 };
                return (
                  <div 
                    key={coin.id}
                    onClick={() => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)}
                    style={{
                      background: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderColor: signal.signal.includes('BUY') ? '#52c41a' : signal.signal === 'SELL' ? '#ff4d4f' : '#30363d'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{coin.symbol}</span>
                        <span style={{ color: '#8b949e', marginLeft: '0.5rem', fontSize: '0.875rem' }}>{coin.name}</span>
                      </div>
                      <div 
                        style={{
                          background: getSignalColor(signal.signal),
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {getSignalText(signal.signal)}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      ${formatPrice(coin.price)}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8b949e' }}>
                      <span>24h:</span>
                      <span style={{ color: coin.change24h >= 0 ? '#3fb950' : '#f85149' }}>
                        {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                    </div>

                    {selectedCoin?.id === coin.id && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #30363d' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div>
                            <span style={{ color: '#8b949e' }}>RSI(14):</span>
                            <span style={{ marginLeft: '0.5rem' }}>{signal.rsi}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8b949e' }}>MA7:</span>
                            <span style={{ marginLeft: '0.5rem' }}>${formatPrice(signal.ma7)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8b949e' }}>MA25:</span>
                            <span style={{ marginLeft: '0.5rem' }}>${formatPrice(signal.ma25)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📊 信号说明</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: '#52c41a' }}>●</span> 强烈买入 - RSI &lt; 30, MA7 &lt; MA25</div>
              <div><span style={{ color: '#73d13d' }}>●</span> 买入 - RSI &lt; 40</div>
              <div><span style={{ color: '#faad14' }}>●</span> 持有 - RSI 40-60</div>
              <div><span style={{ color: '#ff4d4f' }}>●</span> 卖出 - RSI &gt; 70</div>
            </div>
          </div>
        </main>

        <footer style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', borderTop: '1px solid #30363d', textAlign: 'center', color: '#8b949e', fontSize: '0.875rem' }}>
          <p>数据来源: CoinGecko API | 每30秒自动刷新</p>
          <p>⚠️ 投资有风险，入市需谨慎。本网站仅供学习参考，不构成投资建议。</p>
        </footer>
      </div>
    </>
  );
}
