import Redis from 'ioredis';

let redisClient = null;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT || 10911;
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 300, 2000);
        },
      });
    } else if (redisHost) {
      redisClient = new Redis({
        host: redisHost,
        port: Number(redisPort),
        password: redisPassword,
        maxRetriesPerRequest: 3,
      });
    }

    if (redisClient) {
      redisClient.on('connect', () => {
        console.log('✓ Redis Cloud Connected');
      });

      redisClient.on('error', (err) => {
        console.warn(`⚠️ Redis notice: ${err.message}`);
      });
    }
  } catch (error) {
    console.warn(`Failed to initialize Redis: ${error.message}`);
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;
