import { Router } from 'express';
import { getPrices, getOHLC, SUPPORTED_COINS } from '../services/coingecko.js';
import { 
  calculateMA, 
  calculateRSI, 
  extractClosePrices,
  generateSignal 
} from '../services/indicators.js';

const router = Router();

// GET /api/signals - 获取所有币种的买卖信号
router.get('/', async (req, res) => {
  try {
    const results = [];
    
    for (const coin of SUPPORTED_COINS) {
      try {
        const ohlc = await getOHLC(coin.id, 100);
        const closePrices = extractClosePrices(ohlc);
        
        const ma7 = calculateMA(closePrices, 7);
        const ma25 = calculateMA(closePrices, 25);
        const ma99 = calculateMA(closePrices, 99);
        const rsi14 = calculateRSI(closePrices, 14);
        
        const signal = generateSignal({ ma7, ma25, ma99, rsi14 }, closePrices);
        
        results.push({
          coin: {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name
          },
          signal,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Error processing ${coin.id}:`, err.message);
      }
    }
    
    // 按信号排序：BUY > HOLD > SELL
    const signalOrder = { 'BUY': 0, 'HOLD': 1, 'SELL': 2 };
    results.sort((a, b) => signalOrder[a.signal.signal] - signalOrder[b.signal.signal]);
    
    res.json(results);
  } catch (error) {
    console.error('Error generating signals:', error.message);
    res.status(500).json({ error: 'Failed to generate signals' });
  }
});

// GET /api/signals/:coinId - 获取单个币种的信号
router.get('/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    
    const coin = SUPPORTED_COINS.find(c => c.id === coinId);
    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }
    
    const ohlc = await getOHLC(coinId, 100);
    const closePrices = extractClosePrices(ohlc);
    
    const ma7 = calculateMA(closePrices, 7);
    const ma25 = calculateMA(closePrices, 25);
    const ma99 = calculateMA(closePrices, 99);
    const rsi14 = calculateRSI(closePrices, 14);
    
    const signal = generateSignal({ ma7, ma25, ma99, rsi14 }, closePrices);
    
    res.json({
      coin: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name
      },
      signal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating signal:', error.message);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

export default router;
