import { type Context } from "hono"
import * as booksService from "./service.js"
import { failureResponse, successResponse } from "../../utils/response.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwtService.js";
import { comparePassword } from "../../utils/bcryptService.js";
import redis from "../../config/redis.js";
import { createAuthorSchema, createCategorySchema, createTagSchema } from "./validation.js";



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