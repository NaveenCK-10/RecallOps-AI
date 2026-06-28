import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
  NVIDIA_BASE_URL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  // Hindsight: local Docker server (npm: @vectorize-io/hindsight-client)
  HINDSIGHT_BASE_URL: process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888',
  // CascadeFlow: in-process SDK — no server URL needed (npm: @cascadeflow/core)
  // Uses OPENAI_API_KEY or NVIDIA_API_KEY for real inference via CascadeAgent
};
