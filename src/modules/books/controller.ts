import { type Context } from "hono"
import * as booksService from "./service.js"
import { failureResponse, successResponse } from "../../utils/response.js";
import { bookQuerySchema, createAuthorSchema, createBookSchema, createCategorySchema, createTagSchema, updateBookSchema, } from "./validation.js";
import { deleteThumbnail, uploadThumbnail } from "../../utils/ThumbnailFile.js";



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
// export const createBook = async (c: Context) => {
//     const userId = c.get("user").id;
//     const formData = await c.req.formData();

//     // Extract fields
//     const title = formData.get('title') as string;
//     const description = formData.get('description') as string;
//     const price = Number(formData.get('price'));
//     const categoryId = Number(formData.get('categoryId'));
//     const authorId = formData.get('authorId') ? Number(formData.get('authorId')) : null;
//     // const tags = formData.getAll('tags').map(tag => Number(tag)); // assume multiple tags
//     const tags = formData
//         .getAll('tags')
//         .map(tag => Number(tag))
//         .filter(tag => !isNaN(tag));
//     const thumbnailFile = formData.get('thumbnail') as File | null;

//     const validatedData = createBookSchema.parse({
//         title,
//         description,
//         price,
//         categoryId,
//         authorId,
//         tags,
//     });
//     // Handle thumbnail upload if exists
//     let thumbnailUrl: string | null = null;
//     // if (thumbnailFile && thumbnailFile.size > 0) {
//     //     // Save the file to disk
//     //     const arrayBuffer = await thumbnailFile.arrayBuffer();
//     //     const buffer = Buffer.from(arrayBuffer);
//     //     const filename = `${Date.now()}_${thumbnailFile.name}`;
//     //     const fs = await import('fs/promises');
//     //     await fs.writeFile(`./uploads/${filename}`, buffer);
//     //     thumbnailUrl = `/uploads/${filename}`; // save URL to DB
//     // }
//     if (thumbnailFile) {
//         thumbnailUrl = await uploadThumbnail(thumbnailFile);
//     }


//     const book = await booksService.createBook(userId, {
//         ...validatedData,
//         thumbnail: thumbnailUrl,
//     });
//     return successResponse(c, book, 201);
// };

export const createBook = async (c: Context) => {
    const userId = c.get("user").id;
    const formData = await c.req.formData();

    // Extract fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const price = Number(formData.get('price'));
    const categoryId = Number(formData.get('categoryId'));
    const authorId = formData.get('authorId') ? Number(formData.get('authorId')) : null;
    const tags = formData
        .getAll('tags')
        .map(tag => Number(tag))
        .filter(tag => !isNaN(tag));
    const thumbnailFile = formData.get('thumbnail') as File | null;

    const validatedData = createBookSchema.parse({
        title,
        description,
        price,
        categoryId,
        authorId,
        tags,
    });

    const book = await booksService.createBook(userId,
        validatedData,
        thumbnailFile ?? undefined
    );

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
    await deleteThumbnail(existingBook.thumbnail!);
    await booksService.deleteBook(bookId);
    return c.json({ success: true, message: "Book deleted successfully" });
}



// controllers/booksController.ts
export const editBook = async (c: Context) => {
    const userId = c.get('user').id;
    const bookId = Number(c.req.param('bookId'));
    const formData = await c.req.formData();

    // Extract fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const price = formData.get('price') ? Number(formData.get('price')) : undefined;
    const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : undefined;
    const authorId = formData.get('authorId') ? Number(formData.get('authorId')) : undefined;
    const tags = formData
        .getAll('tags')
        .map(tag => Number(tag))
        .filter(tag => !isNaN(tag));
    const thumbnailFile = formData.get('thumbnail') as File | null;

    
    const validatedData = updateBookSchema.parse({
        title,
        description,
        price,
        categoryId,
        authorId,
        tags: tags.length > 0 ? tags : undefined,
    });

    const updatedBook = await booksService.editBook(
        userId,
        bookId,
        validatedData,
        thumbnailFile ?? undefined
    );

    return successResponse(c, updatedBook, 200);
};
