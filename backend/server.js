import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import analyzeRoutes from './routes/analyze.js';
import memoryRoutes from './routes/memory.js';
import incidentRoutes from './routes/incidents.js';
import analyticsRoutes from './routes/analytics.js';
import runtimeRoutes from './routes/runtime.js';

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Always allow the requesting origin for hackathon reliability
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '500kb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/runtime', runtimeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'RecallOps AI' });
});

// Error handling
app.use(errorHandler);

const PORT = config.PORT || 3001;

const start = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 RecallOps AI Backend running on port ${PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   MongoDB: ${config.MONGODB_URI ? 'configured' : 'using in-memory store'}\n`);
  });
};

start();
