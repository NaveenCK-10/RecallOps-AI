import mongoose from 'mongoose';
import { config } from './env.js';

// In-memory store fallback when MongoDB is not available
export const inMemoryStore = {
  incidents: [],
  memories: [],
  runtimeLogs: [],
};

export const connectDB = async () => {
  if (!config.MONGODB_URI) {
    console.log('⚠️  No MONGODB_URI set — using in-memory store');
    return;
  }
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Falling back to in-memory store');
  }
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;
