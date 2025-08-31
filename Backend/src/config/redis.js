const redis = require('redis');

// Redis v4 client with reconnect strategy
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    // Exponential backoff with cap at 3s, stop after ~10 attempts
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Retry attempts for Redis exhausted');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('connect', () => {
  console.log('✅ Redis connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready');
});

redisClient.on('end', () => {
  console.log('ℹ️ Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('♻️ Redis reconnecting...');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('❌ Redis initial connection error:', err);
});

module.exports = redisClient;
