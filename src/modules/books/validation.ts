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




// Types
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;