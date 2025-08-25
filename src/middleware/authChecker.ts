import 'dotenv/config';
import type { Context, Next } from 'hono';
import redis from '../config/redis.js';
import { verifyAccessToken } from '../utils/jwtService.js';

// Middleware
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization header missing' }, 401);
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) {
      return c.json({ error: 'UNAUTHORIZED' }, 401);
    }

    const decoded = verifyAccessToken(token);

    // (Optional) check if token is blacklisted (logout/forced expire scenario)
    const blacklisted = await redis.get(`refresh:${decoded.userId}`);
    if (!blacklisted) {
      return c.json({ success: false, error: 'Token is no longer valid' }, 401);
    }

    // Attach userId to context
    c.set('user', { id: decoded.userId });

    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid or expired access token' }, 401);
  }
};
