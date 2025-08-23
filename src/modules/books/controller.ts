import { type Context } from "hono"
import * as booksService from "./service.js"
import { failureResponse, successResponse } from "../../utils/response.js";
import { bookQuerySchema, createAuthorSchema, createBookSchema, createCategorySchema, createTagSchema, } from "./validation.js";



// ================= Categories =================
export const createCategory = async (c: Context) => {
    const body = await c.req.json();
    const validatedData = createCategorySchema.parse(body);
    const category = await booksService.createCategory(validatedData);
    return successResponse(c, category, 201);
};

export const getCategories = async (c: Context) => {
    const categories = await booksService.getCategories();
    return successResponse(c, categories);
};

// ================= Authors =================
export const createAuthor = async (c: Context) => {
    const body = await c.req.json();
    const validatedDatadata = createAuthorSchema.parse(body);
    const author = await booksService.createAuthor(validatedDatadata);
    return successResponse(c, author, 201);

};

export const getAuthors = async (c: Context) => {
    const authors = await booksService.getAuthors();
    return successResponse(c, authors);
};

// ================= Tags =================
export const createTag = async (c: Context) => {
    const body = await c.req.json();
    const validatedDatadata = createTagSchema.parse(body);
    const tag = await booksService.createTag(validatedDatadata);
    return successResponse(c, tag, 201);
};

export const getTags = async (c: Context) => {
    const tags = await booksService.getTags();
    return successResponse(c, tags);
};



// ================= Books =================
export const createBook = async (c: Context) => {
    const body = await c.req.json();
    const validatedData = createBookSchema.parse(body);
    const userId = c.get("user").id;
    const book = await booksService.createBook(userId, validatedData);
    return successResponse(c, book, 201);
};

export const getBookById = async (c: Context) => {
    const bookId = parseInt(c.req.param("bookId"));
    const book = await booksService.getBookById(bookId);
    if (!book) return failureResponse(c, "Book not found", 404);
    return successResponse(c, book);
};

export const getAllBooks = async (c: Context) => {
    const query = bookQuerySchema.parse(c.req.query());
    const books = await booksService.getBooks(query);
    return successResponse(c, books);
};

export const getMyBooks = async (c: Context) => {
    const userId = c.get('user').id
    const query = bookQuerySchema.parse(c.req.query());
    const books = await booksService.getBooks({ ownerId: userId, ...query });
    return successResponse(c, books);
};


export const deleteBook = async (c: Context) => {
    const bookId = parseInt(c.req.param("bookId"));
    const existingBook = await booksService.getBookById(bookId);
    if (!existingBook) return failureResponse(c, "Book not found", 404);
    await booksService.deleteBook(bookId);
    return successResponse(c, "Book deleted successfully");
}