import { Router } from 'express';
import { sendFeishuMessage, sendStockSignalNotification, testFeishuConnection, sendDailySummary } from '../services/feishu.js';
import { getPrices } from '../services/stock.js';

const router = Router();

// POST /api/feishu/send - 发送测试消息
router.post('/send', async (req, res) => {
  try {
    const { message, msgType } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    const result = await sendFeishuMessage(message, msgType || 'text');
    res.json(result);
  } catch (error) {
    console.error('发送飞书消息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feishu/test - 测试飞书连接
router.post('/test', async (req, res) => {
  try {
    const result = await testFeishuConnection();
    res.json(result);
  } catch (error) {
    console.error('测试飞书连接失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feishu/signal - 发送股票信号通知
router.post('/signal', async (req, res) => {
  try {
    const { stock, signal } = req.body;
    
    if (!stock || !signal) {
      return res.status(400).json({ error: '股票和信号不能为空' });
    }
    
    const result = await sendStockSignalNotification(stock, signal);
    res.json(result);
  } catch (error) {
    console.error('发送信号通知失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feishu/daily - 发送每日汇总
router.post('/daily', async (req, res) => {
  try {
    const prices = await getPrices();
    const result = await sendDailySummary(prices);
    res.json(result);
  } catch (error) {
    console.error('发送每日汇总失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
