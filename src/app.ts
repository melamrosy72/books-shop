import 'dotenv/config';
import { Hono, type Context } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { routes } from './modules/index.js';
import { ClientError } from './utils/errorHandler.js';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import z from 'zod';
import { serveStatic } from '@hono/node-server/serve-static';
import { secureHeaders } from 'hono/secure-headers';
import { reqLimiter, bodyLimiter } from './middleware/limiters.js';

const app = new Hono();
// Middlewares
app.use('*', logger());
app.use('*', cors());
app.use(secureHeaders());
app.use('/uploads/*', serveStatic({ root: './' }));
app.use('/paths-to-be-protected/', csrf());
app.use('*', bodyLimiter);
app.use('*', reqLimiter);

// Routes
app.route('/api/v1/auth', routes.auth);
app.route('/api/v1/users', routes.users);
app.route('/api/v1/books', routes.books);
app.get('/', (c: Context) =>
  c.json({ status: 'success', message: 'Books Shop API is running 🚀' }),
);

// Error handling
app.notFound((c: Context) => c.json({ error: 'Not found' }, 404));
app.onError((err: Error, c: Context) => {
  if (err instanceof ClientError) {
    return c.json({ success: false, error: err.message }, 400);
  }
  if (err instanceof z.ZodError) {
    // const messages = err.issues.map((issue) => issue.message);
    const messages = err.issues;
    return c.json({ success: false, errors: messages }, 400);
  }
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return c.json({ success: false, error: 'Invalid JSON format' }, 400);
  }
  console.log(err);
  return c.json({ error: err.message }, 500);
});

// Start server in Node
const port = parseInt(process.env.PORT || '3000');
serve({ fetch: app.fetch, port });
console.log(`🚀 Server running on http://localhost:${port}`);
