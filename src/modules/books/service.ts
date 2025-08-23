// src/modules/authors/service.ts
import { db } from "../../db/index.js";
import { authors, books, booksToTags, categories, tags } from "../../db/schema.js";
import { and, asc, between, desc, eq, gt, gte, ilike, lt, lte, SQL, sql } from "drizzle-orm";
import { ClientError } from "../../utils/errorHandler.js";
import type { BookQueryInput, CreateAuthorInput, CreateBookInput, CreateCategoryInput, CreateTagInput, UpdateBookInput } from "./validation.js";
import { deleteThumbnail, uploadThumbnail } from "../../utils/ThumbnailFile.js";

//                                  ====== Categories =====
// Create Category
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
// Create Tag
export const createTag = async (data: CreateTagInput) => {
    const existing = await db.query.tags.findFirst({
        where: eq(tags.name, data.name),
    });
    if (existing) throw new ClientError("Tag already exists", 409);
    const [tag] = await db.insert(tags).values(data).returning();
    return tag;
};
// Get all Tags
export const getTags = async () => {
    return await db.select().from(tags);
};



//                                  ====== Books =====
// Create Book
export const createBook = async (userId: number, data: CreateBookInput, thumbnailFile?: File) => {
    // Handle thumbnail upload
    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
    }
    // TODO : validate tags,category and author existence before creating
    // create book
    const [book] = await db.insert(books).values({
        ...data,
        ownerId: userId,
        thumbnail: thumbnailUrl,
    }).returning();

    // insert in pivot table
    if (data.tags && data.tags.length > 0) {
        const tagsData = data.tags.map((tagId: number) => ({
            bookId: book.id,
            tagId,
        }));
        await db.insert(booksToTags).values(tagsData);
    }
    return book;
};
// Get Book By Id
export const getBookById = async (id: number) => {
    const [book] = await db
        .select({
            id: books.id,
            title: books.title,
            description: books.description,
            price: books.price,
            thumbnail: books.thumbnail,
            author: { id: authors.id, name: authors.name },
            ownerId: books.ownerId,
            category: { id: categories.id, name: categories.name },
            tags: sql`json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}))`.as("tags"),
        })
        .from(books)
        .innerJoin(categories, eq(categories.id, books.categoryId))
        .innerJoin(authors, eq(authors.id, books.authorId))
        .leftJoin(booksToTags, eq(booksToTags.bookId, books.id))
        .leftJoin(tags, eq(tags.id, booksToTags.tagId))
        .where(eq(books.id, id))
        .groupBy(books.id, authors.id, categories.id)

    return book;
};

// Get Books
export const getBooks = async (query: BookQueryInput) => {
    const { search, sort, paginated = false, categoryId, ownerId } = query;
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 25;

    const min = query.minPrice ? Number(query.minPrice) : undefined;
    const max = query.maxPrice ? Number(query.maxPrice) : undefined;

    const orderBy = sort === "desc" ? desc(books.title) : asc(books.title);

    let whereClause;

    if (search) {
        whereClause = and(whereClause, ilike(books.title, `%${search}%`));
    }
    if (min !== undefined && max !== undefined) {
        whereClause = and(whereClause, between(books.price, min, max));
    } else if (min !== undefined) {
        whereClause = and(whereClause, gte(books.price, min));
    } else if (max !== undefined) {
        whereClause = and(whereClause, lte(books.price, max));
    }

    if (categoryId) {
        whereClause = and(whereClause, eq(books.categoryId, categoryId));
    }
    if (ownerId) {
        whereClause = and(whereClause, eq(books.ownerId, ownerId));
    }
    const docs = await db
        .select({
            id: books.id,
            title: books.title,
            price: books.price,
            thumbnail: books.thumbnail,
            author: { id: authors.id, name: authors.name },
            category: { id: categories.id, name: categories.name },
            tags: sql`
                json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}))
                FILTER (WHERE ${tags.id} IS NOT NULL)
            `.as("tags"),
        })
        .from(books)
        .innerJoin(categories, eq(categories.id, books.categoryId))
        .innerJoin(authors, eq(authors.id, books.authorId))
        .leftJoin(booksToTags, eq(booksToTags.bookId, books.id))
        .leftJoin(tags, eq(tags.id, booksToTags.tagId))
        .where(whereClause)
        .groupBy(books.id, authors.id, categories.id)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit);

    const [totalDocs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(books)
        .where(whereClause);

    const totalCount = Number(totalDocs.count);

    return paginated
        ? {
            docs,
            totalDocs: totalCount,
            limit,
            page,
            totalPages: Math.ceil(totalCount / limit),
        }
        : {
            docs,
            totalDocs: totalCount,
        };
};

export const deleteBook = async (id: number) => {
    await db.delete(books).where(eq(books.id, id));
}





export const editBook = async (
    userId: number,
    bookId: number,
    data: UpdateBookInput,
    thumbnailFile?: File
) => {
    // check book existence
    const existingBook = await getBookById(bookId);
    if (!existingBook) throw new ClientError("Book not found", 404);
    // check ownership
    if (existingBook.ownerId !== userId) throw new ClientError("Unauthorized", 401);
    // Handle thumbnail upload and delete old thumbnail
    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
        // Delete old thumbnail
        if(existingBook.thumbnail) await deleteThumbnail(existingBook.thumbnail);
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
    }

    // Update book
    await db.update(books)
        .set({
            ...data,
            thumbnail: thumbnailUrl,
            updatedAt: new Date(),
        })
        .where(eq(books.id, bookId));

    // Update tags if provided
    if (data.tags) {
        // Remove old tags
        await db.delete(booksToTags).where(eq(booksToTags.bookId, bookId));
        if (data.tags.length > 0) {
            const tagsData = data.tags.map(tagId => ({ bookId, tagId }));
            await db.insert(booksToTags).values(tagsData);
        }
    }

    // Return updated book
    const [updatedBook] = await db.select().from(books).where(eq(books.id, bookId));
    return updatedBook;
};