import axios from 'axios';

// 飞书Webhook配置
// 在环境变量中设置: FEISHU_WEBHOOK_URL
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || '';

// 飞书机器人ID (可选，使用机器人API时需要)
const FEISHU_BOT_ID = process.env.FEISHU_BOT_ID || '';
const FEISHU_BOT_SECRET = process.env.FEISHU_BOT_SECRET || '';

// 发送富文本消息到飞书
export async function sendFeishuMessage(content, msgType = 'text') {
  if (!FEISHU_WEBHOOK_URL) {
    console.log('⚠️ 飞书Webhook未配置，跳过推送');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    let payload;
    
    if (msgType === 'rich_text') {
      // 富文本消息
      payload = {
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: '📈 股票信号通知',
              content: [
                [
                  {
                    tag: 'text',
                    text: content
                  }
                ]
              ]
            }
          }
        }
      };
    } else {
      // 文本消息
      payload = {
        msg_type: 'text',
        content: {
          text: content
        }
      };
    }

    const response = await axios.post(FEISHU_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    if (response.data && response.data.code === 0) {
      console.log('✅ 飞书消息发送成功');
      return { success: true };
    } else {
      console.error('❌ 飞书消息发送失败:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('❌ 飞书消息发送失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 发送股票信号通知
export async function sendStockSignalNotification(stock, signal) {
  const market = stock.market === '港股' ? '港股' : 'A股';
  const priceSymbol = stock.market === '港股' ? 'HK$' : '¥';
  
  const emoji = signal.signal.includes('BUY') ? '🟢' : signal.signal.includes('SELL') ? '🔴' : '🟡';
  
  const message = `${emoji} ${signal.signal} 信号通知

${market} ${stock.symbol} (${stock.name})
当前价格: ${priceSymbol}${stock.price}
涨跌幅: ${stock.change24h >= 0 ? '+' : ''}${stock.change24h?.toFixed(2) || 0}%
信号: ${signal.signal}
原因: ${signal.reason || '分析中'}

🕐 ${new Date().toLocaleString('zh-CN')}`;

  return sendFeishuMessage(message, 'rich_text');
}

// 发送每日汇总
export async function sendDailySummary(stocks) {
  const buyStocks = stocks.filter(s => s.signal?.signal?.includes('BUY'));
  const sellStocks = stocks.filter(s => s.signal?.signal?.includes('SELL'));
  
  let message = '📊 每日股票信号汇总\n\n';
  
  if (buyStocks.length > 0) {
    message += '🟢 买入信号:\n';
    buyStocks.forEach(s => {
      message += `  • ${s.symbol} ${s.name} ${s.market === '港股' ? 'HK$' : '¥'}${s.price} (${s.change24h >= 0 ? '+' : ''}${s.change24h?.toFixed(2)}%)\n`;
    });
    message += '\n';
  }
  
  if (sellStocks.length > 0) {
    message += '🔴 卖出信号:\n';
    sellStocks.forEach(s => {
      message += `  • ${s.symbol} ${s.name} ${s.market === '港股' ? 'HK$' : '¥'}${s.price} (${s.change24h >= 0 ? '+' : ''}${s.change24h?.toFixed(2)}%)\n`;
    });
    message += '\n';
  }
  
  message += `\n🕐 ${new Date().toLocaleString('zh-CN')}`;
  
  return sendFeishuMessage(message, 'rich_text');
}

// 测试飞书连接
export async function testFeishuConnection() {
  return sendFeishuMessage('✅ 测试消息: 股票信号服务已启动!', 'text');
}
