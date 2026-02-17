import { Router } from 'express';
import axios from 'axios';
import iconv from 'iconv-lite';
import { getPrices, getStockById, SUPPORTED_STOCKS } from '../services/stock.js';

const router = Router();

// GET /api/crypto/prices - 获取所有股票实时价格
router.get('/prices', async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// GET /api/crypto/coins - 获取支持的股票列表
router.get('/coins', (req, res) => {
  res.json(SUPPORTED_STOCKS);
});

// GET /api/crypto/ohlc/:coinId - 获取K线数据
router.get('/ohlc/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = 60, adjust = 'qfq' } = req.query;
    
    const stock = SUPPORTED_STOCKS.find(s => s.id === coinId);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // 腾讯K线API
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${stock.code},day,,,${days},${adjust}`;
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      timeout: 10000 
    });
    
    const html = iconv.decode(response.data, 'GBK');
    const data = JSON.parse(html);
    
    const stockData = data.data[stock.code];
    if (!stockData || !stockData.qfqday) {
      return res.json({ 
        coinId, 
        symbol: stock.symbol, 
        name: stock.name,
        klines: [] 
      });
    }
    
    const klines = stockData.qfqday.map(k => ({
      date: k[0],
      open: parseFloat(k[1]),
      close: parseFloat(k[2]),
      high: parseFloat(k[3]),
      low: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
    
    res.json({
      coinId,
      symbol: stock.symbol,
      name: stock.name,
      klines
    });
  } catch (error) {
    console.error('Error fetching OHLC:', error.message);
    res.status(500).json({ error: 'Failed to fetch OHLC data' });
  }
});

// GET /api/crypto/indicators/:coinId - 获取技术指标 (简化版)
router.get('/indicators/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const stock = await getStockById(coinId);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // 简化版技术指标 (基于涨跌幅生成信号)
    let signal = 'HOLD';
    let rsi = 50;
    
    if (stock.change24h > 3) {
      signal = 'STRONG_BUY';
      rsi = 75;
    } else if (stock.change24h > 1) {
      signal = 'BUY';
      rsi = 65;
    } else if (stock.change24h < -3) {
      signal = 'STRONG_SELL';
      rsi = 25;
    } else if (stock.change24h < -1) {
      signal = 'SELL';
      rsi = 35;
    } else if (stock.change24h >= -1 && stock.change24h <= 1) {
      rsi = 50;
    }
    
    res.json({
      coinId,
      signal,
      indicators: {
        rsi14: rsi,
        change: stock.change24h
      }
    });
  } catch (error) {
    console.error('Error calculating indicators:', error.message);
    res.status(500).json({ error: 'Failed to calculate indicators' });
  }
});

export default router;
