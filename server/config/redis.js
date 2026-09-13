import Redis from 'ioredis';

let redisClient = null;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT || 10911;
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    const retryStrategy = (times) => {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 500, 2000);
    };

    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy,
        enableOfflineQueue: false,
      });
    } else if (redisHost) {
      redisClient = new Redis({
        host: redisHost,
        port: Number(redisPort),
        password: redisPassword,
        maxRetriesPerRequest: 1,
        retryStrategy,
        enableOfflineQueue: false,
      });
    }

    if (redisClient) {
      let loggedError = false;
      redisClient.on('connect', () => {
        console.log('✓ Redis Cloud Connected');
        loggedError = false;
      });

      redisClient.on('error', (err) => {
        if (!loggedError) {
          console.warn(`ℹ️ Redis notice: ${err.message} (Caching will be bypassed gracefully)`);
          loggedError = true;
        }
      });
    }
  } catch (error) {
    console.warn(`Failed to initialize Redis: ${error.message}`);
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;
