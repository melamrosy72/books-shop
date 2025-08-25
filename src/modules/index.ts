import { authRoutes } from './auth/routes.js';
import { usersRoutes } from './users/routes.js';
import { booksRoutes } from './books/routes.js';

// TODO : import all routes here

export const routes = {
  auth: authRoutes,
  users: usersRoutes,
  books: booksRoutes,
};
