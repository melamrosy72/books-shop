// src/modules/authors/service.ts
import { db } from "../../db/index.js";
import { authors, categories, tags } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { ClientError } from "../../utils/errorHandler.js";
import type { CreateAuthorInput, CreateCategoryInput, CreateTagInput } from "./validation.js";


//                                  ====== Categories =====
export const createCategory = async (data: CreateCategoryInput) => {
    const existing = await db.query.categories.findFirst({
        where: eq(categories.name, data.name),
    });
    if (existing) throw new ClientError("Category already exists", 409);
    const [category] = await db.insert(categories).values(data).returning();
    return category;
};

// Get all Authors
export const getCategories = async () => {
    return await db.select().from(categories);
};

//                                  ====== Authors =====
// Create Author
export const createAuthor = async (data: CreateAuthorInput) => {
    const existing = await db.query.authors.findFirst({
        where: eq(authors.name, data.name),
    });
    if (existing) throw new ClientError("Author already exists", 409);
    const [newAuthor] = await db.insert(authors).values(data).returning();
    return newAuthor;
};

// Get all Authors
export const getAuthors = async () => {
    return await db.select().from(authors);
};


//                                  ====== Tags =====
// Create Author
export const createTag = async (data: CreateTagInput) => {
    const existing = await db.query.tags.findFirst({
        where: eq(tags.name, data.name),
    });
    if (existing) throw new ClientError("Tag already exists", 409);
    const [tag] = await db.insert(tags).values(data).returning();
    return tag;
};

// Get all Authors
export const getTags = async () => {
    return await db.select().from(tags);
};



//                                  ====== Books =====