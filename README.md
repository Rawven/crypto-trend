# 📈 Crypto Trend

加密货币趋势分析平台 - 帮助你判断现在该买什么！

## 项目简介

实时监控加密货币市场，提供技术指标分析和买卖信号提示。

## 技术栈

### 后端
- Express.js
- CoinGecko API (行情数据)
- SQLite (数据存储)
- technicalindicators (技术指标)

### 前端
- Next.js
- TradingView Lightweight Charts

## 项目结构

```
crypto-trend/
├── crypto-trend-backend/   # 后端 API
└── crypto-trend-frontend/  # 前端页面
```

## 快速开始

### 后端

```bash
cd crypto-trend-backend
npm install
npm start
```

后端运行在 http://localhost:3002

### 前端

```bash
cd crypto-trend-frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000

## 功能

- [x] 实时价格监控
- [x] K线图表展示
- [x] 技术指标 (MA, RSI)
- [x] 买卖信号提示
- [ ] 预警推送
- [ ] 模拟交易

## 支持的币种

- BTC (Bitcoin)
- ETH (Ethereum)
- BNB (BNB)
- SOL (Solana)
- XRP (Ripple)
- ADA (Cardano)
- DOGE (Dogecoin)
- DOT (Polkadot)

## 贡献

欢迎提交 PR 和 Issue！

## License

MIT
