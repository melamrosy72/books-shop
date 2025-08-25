import { rateLimiter } from 'hono-rate-limiter';
import { bodyLimit } from 'hono/body-limit';

// limit numbers is just examples
export const reqLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  keyGenerator: (c) =>
    c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'anonymous',
});

export const bodyLimiter = bodyLimit({
  maxSize: 5 * 1024 * 1024, // 5 MB
  onError: (c) => {
    return c.json({ success: false, error: 'Payload too large!' }, 413);
  },
});
