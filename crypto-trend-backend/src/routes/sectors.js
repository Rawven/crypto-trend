import { Router } from 'express';
import { getPrices, SUPPORTED_STOCKS } from '../services/stock.js';

const router = Router();

// 板块映射
const SECTOR_MAP = {
  'sh600036': '银行', 'sh601988': '银行', 'sh601398': '银行', 'sh600016': '银行', 'sh600000': '银行', 'sz000001': '银行', 'hk00939': '银行', 'hk01398': '银行', 'hk03988': '银行', 'hk00011': '银行',
  'sh601318': '保险', 'hk02318': '保险', 'hk02628': '保险', 'hk02328': '保险',
  'sh600519': '白酒', 'sz000858': '白酒', 'sz000596': '白酒', 'sz000869': '白酒',
  'hk00700': '科技', 'hk09988': '科技', 'hk01810': '科技', 'hk09618': '科技', 'sz002230': '科技', 'sz002415': '科技', 'sh688041': '科技', 'sz300059': '科技',
  'sh600276': '医药', 'sz000538': '医药', 'sz000423': '医药', 'sz300015': '医药', 'sz300122': '医药', 'sz300142': '医药', 'sz300347': '医药', 'sz300750': '医药',
  'sz002594': '新能源', 'sz002714': '新能源', 'sz300014': '新能源', 'hk00175': '新能源',
  'sz000002': '房地产', 'hk00017': '房地产', 'hk00016': '房地产', 'hk00012': '房地产',
  'sh600050': '通信', 'hk00981': '通信',
  'sh601888': '基建', 'sh601668': '基建', 'sh600031': '基建', 'sh600150': '基建', 'hk00267': '基建', 'hk00690': '基建', 'hk00667': '基建',
  'sh600030': '券商', 'hk00388': '券商', 'hk06030': '券商', 'hk06837': '券商',
  'sz000333': '消费', 'sh600690': '消费', 'sz000651': '消费', 'hk03690': '消费', 'hk02331': '消费', 'hk02020': '消费',
  'sh600028': '能源', 'sh601857': '能源', 'sh600309': '能源', 'sh600585': '能源', 'sh600547': '能源', 'hk00386': '能源',
  'sh600900': '电力', 'hk01171': '电力',
  'sh601111': '物流', 'sh600009': '物流', 'sh600018': '物流', 'hk01928': '物流', 'hk00027': '物流',
  'hk09961': '传媒', 'hk01024': '传媒',
  'hk02020': '服装',
};

function getStockSector(stockId) {
  return SECTOR_MAP[stockId] || '其他';
}

// GET /api/sectors - 获取板块涨跌数据
router.get('/', async (req, res) => {
  try {
    const prices = await getPrices();
    
    // 按板块分组计算
    const sectorData = {};
    
    prices.forEach(stock => {
      const sector = getStockSector(stock.id);
      if (!sectorData[sector]) {
        sectorData[sector] = { stocks: [], changeSum: 0 };
      }
      sectorData[sector].stocks.push(stock);
      sectorData[sector].changeSum += stock.change24h || 0;
    });
    
    // 计算板块涨跌
    const sectors = Object.entries(sectorData).map(([name, data]) => ({
      name,
      count: data.stocks.length,
      avgChange: data.count > 0 ? data.changeSum / data.stocks.length : 0,
      upCount: data.stocks.filter(s => s.change24h > 0).length,
      downCount: data.stocks.filter(s => s.change24h < 0).length
    }));
    
    // 按涨跌幅排序
    sectors.sort((a, b) => b.avgChange - a.avgChange);
    
    res.json(sectors);
  } catch (error) {
    console.error('Error generating sectors:', error.message);
    res.status(500).json({ error: 'Failed to generate sectors' });
  }
});

export default router;
