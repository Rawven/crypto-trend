import { Router } from 'express';
import { getPrices, getStockById, SUPPORTED_STOCKS } from '../services/stock.js';

const router = Router();

// 基于涨跌幅 + 模拟RSI 生成买卖信号
function generateSignal(stock) {
  const { change24h, price } = stock;
  
  // 基于价格变动生成合理的模拟RSI (30-70之间波动)
  // 涨幅大的股票RSI倾向于高，反之倾向于低
  const baseRSI = 50 + change24h * 5; 
  const rsi = Math.max(20, Math.min(80, baseRSI + (Math.random() - 0.5) * 20));
  
  let signal = 'HOLD';
  let reason = '波动较小，持有观望';
  
  // RSI超卖/超买 + 涨跌幅综合判断
  if (rsi < 35 && change24h > 0) {
    signal = 'BUY';
    reason = `RSI超卖(${rsi.toFixed(1)})，反弹概率大`;
  } else if (rsi > 65 && change24h < 0) {
    signal = 'SELL';
    reason = `RSI超买(${rsi.toFixed(1)})，回调风险大`;
  } else if (change24h > 3) {
    signal = 'STRONG_BUY';
    reason = '涨幅超过3%，强劲上涨';
  } else if (change24h > 1) {
    signal = 'BUY';
    reason = '涨幅超过1%，温和上涨';
  } else if (change24h < -3) {
    signal = 'STRONG_SELL';
    reason = '跌幅超过3%，强劲下跌';
  } else if (change24h < -1) {
    signal = 'SELL';
    reason = '跌幅超过1%，温和下跌';
  }
  
  return { signal, reason, rsi: rsi.toFixed(1) };
}

// GET /api/signals - 获取所有股票的买卖信号
router.get('/', async (req, res) => {
  try {
    const prices = await getPrices();
    const results = prices.map(stock => {
      const signal = generateSignal(stock);
      return {
        stock: {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market
        },
        signal,
        price: stock.price,
        change24h: stock.change24h,
        timestamp: new Date().toISOString()
      };
    });
    
    // 按涨跌幅排序
    results.sort((a, b) => b.change24h - a.change24h);
    
    res.json(results);
  } catch (error) {
    console.error('Error generating signals:', error.message);
    res.status(500).json({ error: 'Failed to generate signals' });
  }
});

// GET /api/signals/:coinId - 获取单个股票的信号
router.get('/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    
    const stock = await getStockById(coinId);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    const signal = generateSignal(stock);
    
    res.json({
      stock: {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market
      },
      signal,
      price: stock.price,
      change24h: stock.change24h,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating signal:', error.message);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

export default router;
