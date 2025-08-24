// src/modules/books/validation.ts
import { z } from "zod";

// ===== Categories =====
export const createCategorySchema = z.object({
    name: z.string('Category name is required').min(2, "Category name is too short").max(100, "Category name is too long"),
    description: z.string().optional()
});

export const updateCategorySchema = z.object({
    name: z.string().min(2, "Category name should be at least 2 characters").optional(),
    description: z.string().optional()
});

// ===== Authors =====
export const createAuthorSchema = z.object({
    name: z.string('Author name is required').min(2, "Author name is too short").max(100, "Author name is too long"),
    bio: z.string().optional()

});

export const updateAuthorSchema = z.object({
    name: z.string().min(2, "Author name should be at least 2 characters").optional(),
    bio: z.string().optional()

});

// ===== Tags =====
export const createTagSchema = z.object({
    name: z.string('Tag name is required').min(2, "Tag name is too short").max(30, "Tag name is too long"),
});

export const updateTagSchema = z.object({
    name: z.string().min(2, "Tag name is too short").optional(),
});

// ===== Books =====
export const createBookSchema = z.object({
    title: z.string('Title is required').min(1, "Title is required").max(250, "Title is too long"),
    price: z.number('Price is required').positive("Price must be positive"),
    description: z.string().max(1000, "Description is too long").optional(),
    thumbnail: z.string().url("Thumbnail must be a valid URL").optional().nullable(),
    authorId: z.number().int(),
    categoryId: z.number().int(),
    ownerId: z.number().int().optional(),
    tags: z.array(z.number().int()).optional()
});



// Update Book Input
export const updateBookSchema = z.object({
    title: z.string().optional(),
    price: z.number().positive().optional(),
    thumbnail: z.string().url().optional(),
    authorId: z.number().int().optional(),
    categoryId: z.number().int().optional(),
    tags: z.array(z.number().int()).optional(),
});


// Query params (pagination, search, sort)
export const bookQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    paginated: z.coerce.boolean().optional(),
    categoryId: z.coerce.number().int().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    ownerId: z.number().int().optional(),
});






// Types
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;