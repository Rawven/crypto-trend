import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import cryptoRouter from './routes/crypto.js';
import signalsRouter from './routes/signals.js';
import feishuRouter from './routes/feishu.js';

const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database then start server
async function start() {
  try {
    await initDb();
    console.log('📊 Database initialized');
    
    // Routes
    app.use('/api/crypto', cryptoRouter);
    app.use('/api/signals', signalsRouter);
    app.use('/api/feishu', feishuRouter);
    
    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.listen(PORT, () => {
      console.log(`📈 Crypto Trend API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
