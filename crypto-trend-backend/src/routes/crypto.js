import { Router } from 'express';
import { getPrices, getOHLC, SUPPORTED_COINS } from '../services/coingecko.js';
import { 
  calculateMA, 
  calculateRSI, 
  extractClosePrices,
  generateSignal 
} from '../services/indicators.js';

const router = Router();

// GET /api/crypto/prices - 获取所有币种实时价格
router.get('/prices', async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// GET /api/crypto/coins - 获取支持的币种列表
router.get('/coins', (req, res) => {
  res.json(SUPPORTED_COINS);
});

// GET /api/crypto/ohlc/:coinId - 获取K线数据
router.get('/ohlc/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const days = parseInt(req.query.days) || 30;
    
    const ohlc = await getOHLC(coinId, days);
    res.json(ohlc);
  } catch (error) {
    console.error('Error fetching OHLC:', error.message);
    res.status(500).json({ error: 'Failed to fetch OHLC data' });
  }
});

// GET /api/crypto/indicators/:coinId - 获取技术指标
router.get('/indicators/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const days = parseInt(req.query.days) || 100;
    
    // 获取K线数据
    const ohlc = await getOHLC(coinId, days);
    const closePrices = extractClosePrices(ohlc);
    
    // 计算指标
    const ma7 = calculateMA(closePrices, 7);
    const ma25 = calculateMA(closePrices, 25);
    const ma99 = calculateMA(closePrices, 99);
    const rsi14 = calculateRSI(closePrices, 14);
    
    // 生成信号
    const signal = generateSignal({ ma7, ma25, ma99, rsi14 }, closePrices);
    
    res.json({
      coinId,
      signal,
      indicators: {
        ma7: ma7[ma7.length - 1],
        ma25: ma25[ma25.length - 1],
        ma99: ma99[ma99.length - 1],
        rsi14: rsi14[rsi14.length - 1]
      },
      history: {
        ma7,
        ma25,
        ma99,
        rsi14,
        prices: closePrices
      }
    });
  } catch (error) {
    console.error('Error calculating indicators:', error.message);
    res.status(500).json({ error: 'Failed to calculate indicators' });
  }
});

export default router;
