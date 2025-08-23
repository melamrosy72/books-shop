import { Hono } from "hono"
import * as booksController from "./controller.js"
import { authMiddleware } from '../../middleware/authChecker.js';
export const booksRoutes = new Hono()

// ● API for listing all books with pagination
booksRoutes.get('/', booksController.getAllBooks)

// ● API for getting the book details(Title, Price, Thumbnail, Author, Category)
booksRoutes.get('/:bookId/details', booksController.getBookById)

// ● API for editing my books only
booksRoutes.patch('/:bookId', authMiddleware, booksController.editBook)

// ● API for deleting my books only
booksRoutes.delete('/:bookId', booksController.deleteBook)

// ● API for Fetching My Books only with pagination
booksRoutes.get('/my-books', authMiddleware, booksController.getMyBooks)

// ● Create a new book
booksRoutes.post('/', authMiddleware, booksController.createBook)


//                              -------------------->  categories  <--------------------
// ● API for getting all categories
booksRoutes.get('/categories', booksController.getCategories)

// ● API for creating a new category "Authenticated"
booksRoutes.post('/categories', authMiddleware, booksController.createCategory)

//                              -------------------->  authors  <--------------------
// ● API for getting all authors
booksRoutes.get('/authors', booksController.getAuthors)

// ● API for creating a new author "Authenticated"
booksRoutes.post('/authors', authMiddleware, booksController.createAuthor)

//                              -------------------->  tags  <--------------------
// ● API for getting all tags
booksRoutes.get('/tags', booksController.getTags)

// ● API for creating a new tag "Authenticated"
booksRoutes.post('/tags', authMiddleware, booksController.createTag)

