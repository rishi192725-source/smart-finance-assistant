import Redis from 'ioredis';

// Ensures we reuse the Redis connection in dev
declare global {
  var __redis: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisConfig = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false
};

const connection = global.__redis || new Redis(REDIS_URL, redisConfig);

if (process.env.NODE_ENV !== 'production') {
  global.__redis = connection;
}

export { connection };
