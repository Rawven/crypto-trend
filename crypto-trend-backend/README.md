# 📈 Crypto Trend Backend

加密货币趋势分析后端 API。

## 技术栈

- Express.js
- CoinGecko API (行情数据)
- SQLite (数据存储)
- technicalindicators (技术指标)

## 快速开始

```bash
cd crypto-trend-backend
npm install
npm start
```

API 运行在 http://localhost:3002

## API 接口

### 行情数据

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/crypto/prices | 获取所有币种实时价格 |
| GET | /api/crypto/coins | 获取支持的币种列表 |
| GET | /api/crypto/ohlc/:coinId | 获取K线数据 |
| GET | /api/crypto/indicators/:coinId | 获取技术指标 |

### 买卖信号

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/signals | 获取所有币种信号 |
| GET | /api/signals/:coinId | 获取单个币种信号 |

## 技术指标

- MA7, MA25, MA99 (移动平均线)
- RSI14 (相对强弱指数)
- 买卖信号生成逻辑

## 支持的币种

- BTC (Bitcoin)
- ETH (Ethereum)
- BNB (BNB)
- SOL (Solana)
- XRP (Ripple)
- ADA (Cardano)
- DOGE (Dogecoin)
- DOT (Polkadot)
