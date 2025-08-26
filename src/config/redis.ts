import 'dotenv/config';
import { Redis } from 'ioredis';

const isProd = process.env.NODE_ENV === 'production';
const redis = isProd ? new Redis(process.env.REDIS_URL!) : new Redis();

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.log(err.message);
});

export default redis;
