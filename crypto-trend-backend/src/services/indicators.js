import {
  SMA,
  RSI,
  MACD,
  BollingerBands,
  Stochastic
} from 'technicalindicators';

// 计算移动平均线
export function calculateMA(prices, period) {
  const sma = new SMA({ period, values: [] });
  const result = [];
  
  for (const price of prices) {
    const value = sma.nextValue(price);
    result.push(value);
  }
  
  return result;
}

// 计算RSI
export function calculateRSI(prices, period = 14) {
  const rsi = new RSI({ period, values: [] });
  const result = [];
  
  for (const price of prices) {
    const value = rsi.nextValue(price);
    result.push(value);
  }
  
  return result;
}

// 计算MACD
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const macdInput = {
    values: prices,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };
  
  return MACD.calculate(macdInput);
}

// 计算布林带
export function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const bbInput = {
    values: prices,
    period,
    stdDev
  };
  
  return BollingerBands.calculate(bbInput);
}

// 从K线数据提取收盘价数组
export function extractClosePrices(ohlcData) {
  return ohlcData.map(candle => candle.close);
}

// 生成买卖信号
export function generateSignal(indicators, prices) {
  const { ma7, ma25, ma99, rsi14 } = indicators;
  const currentPrice = prices[prices.length - 1];
  const currentMA7 = ma7[ma7.length - 1];
  const currentMA25 = ma25[ma25.length - 1];
  const currentMA99 = ma99[ma99.length - 1];
  const currentRSI = rsi14[rsi14.length - 1];
  
  let signal = 'HOLD';
  let reasons = [];
  
  // RSI 信号
  if (currentRSI < 30) {
    signal = 'BUY';
    reasons.push('RSI超卖(<30)');
  } else if (currentRSI > 70) {
    signal = 'SELL';
    reasons.push('RSI超买(>70)');
  }
  
  // MA 交叉信号
  if (currentMA7 > currentMA25 && currentMA25 > currentMA99) {
    if (signal !== 'SELL') {
      signal = 'BUY';
      reasons.push('MA多头排列');
    }
  } else if (currentMA7 < currentMA25 && currentMA25 < currentMA99) {
    if (signal !== 'BUY') {
      signal = 'SELL';
      reasons.push('MA空头排列');
    }
  }
  
  // 价格与MA关系
  if (currentPrice < currentMA99 * 0.95) {
    if (signal !== 'SELL') {
      signal = 'BUY';
      reasons.push('价格低于MA99 5%以上');
    }
  } else if (currentPrice > currentMA99 * 1.05) {
    if (signal !== 'BUY') {
      signal = 'SELL';
      reasons.push('价格高于MA99 5%以上');
    }
  }
  
  return {
    signal,
    reasons,
    price: currentPrice,
    rsi: currentRSI,
    ma7: currentMA7,
    ma25: currentMA25,
    ma99: currentMA99
  };
}
