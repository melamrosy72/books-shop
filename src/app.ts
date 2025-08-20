import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

// import { authRoutes } from './modules/auth/routes'
// import { bookRoutes } from './modules/books/routes'
// import { profileRoutes } from './modules/profile/routes'

const app = new Hono()

// Middlewares
app.use('*', logger())

// Routes
// app.route('/auth', authRoutes)
// app.route('/books', bookRoutes)
// app.route('/profile', profileRoutes)

app.get('/', (c) => c.json({ status: 'success', message: 'Books Shop API is running 🚀' }))

// Start server in Node
const port = 3000
serve({ fetch: app.fetch, port })
console.log(`🚀 Server running on http://localhost:${port}`)
