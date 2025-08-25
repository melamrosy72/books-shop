#  Books-Shop

A backend service for managing a book shop, built with **Node.js**, **Hono.js**, **PostgreSQL**, **Drizzle ORM**, and **Redis**.  
It includes JWT-based authentication (with refresh tokens stored in Redis), and tests powered by **Vitest**.

---

## 🚀 Tech Stack
- **Node.js**  
- **Hono.js** 
- **PostgreSQL**  
- **Drizzle ORM**
- **Redis** 
- **Vitest**  

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/your-username/books-shop.git
cd books-shop
```

Install dependencies:

```
npm install
```

### Setting up Redis 
```
# Install Redis
sudo apt-get update
sudo apt-get install redis
```

Lastly, start the Redis server like so:

```
sudo service redis-server start
redis-cli ping     
```
should return PONG

### Environment Variables

Create a .env file in the root directory:
```
PORT=3000
DATABASE_URL=postgresql://postgres:admin@localhost:4000/books
JWT_ACCESS_SECRET=veryHard
JWT_REFRESH_SECRET=veryHard
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Running APP
```
npm run dev
```


Production
```
npm run build
npm start
```

Testing
```
npx vitest
```

📬 API Documentation 

You can explore the API using the Postman collection:

[📎 Books Shop Postman Collection](https://elamrosy.postman.co/workspace/Team-Workspace~86195b76-3f3d-4259-863c-a8daeae0f7d7/collection/47848321-dfcbb2f9-f73c-415d-b769-fe176abf4725?action=share&creator=47848321&active-environment=47848321-4ee2b62f-952c-4119-a2de-945ac6b87c21)










