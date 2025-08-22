import { Hono, type Context } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

import { routes } from './modules/index.js'
import { ClientError } from './utils/errorHandler.js'
import type { StatusCode } from 'hono/utils/http-status'
import z from 'zod'
const app = new Hono()

// Middlewares
app.use('*', logger())

// Routes
app.route('/api/v1/auth', routes.auth)

app.get('/', (c: Context) => c.json({ status: 'success', message: 'Books Shop API is running 🚀' }))

app.notFound((c: Context) => c.json({ error: 'Not found' }, 404))
app.onError((err: Error, c: Context) => {
    if (err instanceof ClientError) {
        return c.json({ error: err.message }, 400);
    }
    if (err instanceof z.ZodError) {
        const messages = err.issues.map((issue) => issue.message);
        return c.json({ success: false, errors: messages }, 400);
    }
    return c.json({ error: err.message }, 500)
    // if (err instanceof SyntaxError && err.message.includes('JSON')) {
    //     return c.json({ error: 'Invalid JSON format' }, 400);
    // }
})
// Start server in Node
const port = 3000
serve({ fetch: app.fetch, port })
console.log(`🚀 Server running on http://localhost:${port}`)
