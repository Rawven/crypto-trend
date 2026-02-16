import { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE = 'http://localhost:3002/api';

// 模拟数据（当 API 不可用时）
const MOCK_DATA = [
  { id: 'sh600519', symbol: '贵州茅台', name: 'Kweichow Moutai', market: 'A股', price: 1486.6, change24h: 0 },
  { id: 'sh600036', symbol: '招商银行', name: 'China Merchants Bank', market: 'A股', price: 38.99, change24h: 0 },
  { id: 'sh601318', symbol: '中国平安', name: 'Ping An Insurance', market: 'A股', price: 66.54, change24h: 0 },
  { id: 'sh600900', symbol: '长江电力', name: 'China Yangtze Power', market: 'A股', price: 26.12, change24h: 0 },
  { id: 'sz000858', symbol: '五粮液', name: 'Wuliangye Yibin', market: 'A股', price: 104.62, change24h: 0 },
  { id: 'sz000333', symbol: '美的集团', name: 'Midea Group', market: 'A股', price: 79.8, change24h: 0 },
  { id: 'sz002594', symbol: '比亚迪', name: 'BYD', market: 'A股', price: 91.16, change24h: 0 },
  { id: 'sh688041', symbol: '中芯国际', name: 'SMIC', market: 'A股', price: 262.34, change24h: 0 },
  { id: 'hk00700', symbol: '腾讯控股', name: 'Tencent', market: '港股', price: 0, change24h: 0 },
  { id: 'hk09988', symbol: '阿里巴巴', name: 'Alibaba', market: '港股', price: 0, change24h: 0 },
  { id: 'hk00981', symbol: '中国移动', name: 'China Mobile', market: '港股', price: 0, change24h: 0 },
  { id: 'hk00939', symbol: '建设银行', name: 'CCB', market: '港股', price: 0, change24h: 0 },
  { id: 'hk01810', symbol: '小米集团', name: 'Xiaomi', market: '港股', price: 0, change24h: 0 },
  { id: 'hk03690', symbol: '美团', name: 'Meituan', market: '港股', price: 0, change24h: 0 },
  { id: 'hk02318', symbol: '中国平安(港)', name: 'Ping An (HK)', market: '港股', price: 0, change24h: 0 },
  { id: 'hk02020', symbol: '安踏体育', name: 'ANTA', market: '港股', price: 0, change24h: 0 }
];

const MOCK_SIGNALS = {
  'sh600519': { signal: 'BUY', rsi: 42 },
  'sh600036': { signal: 'BUY', rsi: 48 },
  'sh601318': { signal: 'HOLD', rsi: 55 },
  'sz000858': { signal: 'BUY', rsi: 45 },
  'sz002594': { signal: 'STRONG_BUY', rsi: 65 },
  'hk00700': { signal: 'BUY', rsi: 52 }
};

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const fetchPrices = async () => {
    try {
      // 获取价格和信号
      const [pricesRes, signalsRes] = await Promise.all([
        fetch(`${API_BASE}/crypto/prices`),
        fetch(`${API_BASE}/signals`)
      ]);
      
      if (!pricesRes.ok) throw new Error('API Error');
      
      const pricesData = await pricesRes.json();
      const signalsData = await signalsRes.json();
      
      // 合并价格和信号数据
      const signalsMap = {};
      signalsData.forEach(s => {
        signalsMap[s.stock.id] = s.signal;
      });
      
      const mergedData = pricesData.map(stock => ({
        ...stock,
        signal: signalsMap[stock.id] || { signal: 'HOLD', reason: '分析中' }
      }));
      
      setStocks(mergedData);
      setUseMock(false);
    } catch (error) {
      console.log('使用模拟数据', error.message);
      // 合并模拟数据和模拟信号
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
        <title>📈 A股/港股趋势分析</title>
      </Head>
      <div style={{ minHeight: '100vh', background: '#0d1117', color: '#c9d1d9', padding: '1rem' }}>
        <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
              📈 A股/港股趋势
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>
              {useMock ? '🔴 模拟数据' : '🟢 实时数据 (新浪财经)'}
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🚀 今日股票行情</h2>
            <p style={{ color: '#8b949e', fontSize: '0.875rem' }}>
              A股 + 港股实时行情
            </p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>加载中...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {stocks.map(stock => {
                const signal = stock.signal || { signal: 'HOLD', reason: '分析中' };
                return (
                  <div 
                    key={stock.id}
                    onClick={() => setSelectedStock(selectedStock?.id === stock.id ? null : stock)}
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
                        <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{stock.symbol}</span>
                        <span style={{ color: '#8b949e', marginLeft: '0.5rem', fontSize: '0.875rem' }}>{stock.name}</span>
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          background: stock.market === 'A股' ? '#cf1322' : '#0969da',
                          color: 'white'
                        }}>
                          {stock.market}
                        </span>
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
                      ¥{formatPrice(stock.price)}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#8b949e' }}>
                      <span>涨跌:</span>
                      <span style={{ color: stock.change24h >= 0 ? '#3fb950' : '#f85149' }}>
                        {stock.change24h >= 0 ? '↑' : '↓'} {Math.abs(stock.change24h).toFixed(2)}%
                      </span>
                    </div>

                    {selectedStock?.id === stock.id && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #30363d' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div>
                            <span style={{ color: '#8b949e' }}>信号:</span>
                            <span style={{ marginLeft: '0.5rem' }}>{signal.reason || '分析中'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8b949e' }}>开盘:</span>
                            <span style={{ marginLeft: '0.5rem' }}>¥{formatPrice(stock.open)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8b949e' }}>最高:</span>
                            <span style={{ marginLeft: '0.5rem' }}>¥{formatPrice(stock.high)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8b949e' }}>最低:</span>
                            <span style={{ marginLeft: '0.5rem' }}>¥{formatPrice(stock.low)}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: '#52c41a' }}>●</span> 强烈买入 - 涨幅 &gt; 3%</div>
              <div><span style={{ color: '#73d13d' }}>●</span> 买入 - 涨幅 1-3%</div>
              <div><span style={{ color: '#faad14' }}>●</span> 持有 - 波动 ±1%</div>
              <div><span style={{ color: '#ff4d4f' }}>●</span> 卖出 - 跌幅 1-3%</div>
              <div><span style={{ color: '#cf1322' }}>●</span> 强烈卖出 - 跌幅 &gt; 3%</div>
            </div>
          </div>
        </main>

        <footer style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', borderTop: '1px solid #30363d', textAlign: 'center', color: '#8b949e', fontSize: '0.875rem' }}>
          <p>数据来源: 新浪财经 | 每30秒自动刷新</p>
          <p>⚠️ 投资有风险，入市需谨慎。本网站仅供学习参考，不构成投资建议。</p>
        </footer>
      </div>
    </>
  );
}
