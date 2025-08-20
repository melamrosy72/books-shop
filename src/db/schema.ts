import { relations } from "drizzle-orm";
import { decimal, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";



// Users
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Categories
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
});

// Authors
export const authors = pgTable('authors', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    bio: text('bio'),
});

// Tags
export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 30 }).notNull().unique(),
});

// Books
export const books = pgTable('books', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 250 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    thumbnail: text('thumbnail'),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    authorId: integer('author_id').references(() => authors.id).notNull(),
    ownerId: integer('owner_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});


// Books to Tags (Many-to-Many)
export const booksToTags = pgTable('books_to_tags', {
    id: serial('id').primaryKey(),
    bookId: integer('book_id').references(() => books.id).notNull(),
    tagId: integer('tag_id').references(() => tags.id).notNull(),
});

// User Has Man Books (One-to-Many)
export const usersRelations = relations(users, ({ many }) => ({
    books: many(books),
}));

// Book Relations
export const booksRelations = relations(books, ({ one, many }) => ({
    category: one(categories, {
        fields: [books.categoryId],
        references: [categories.id],
    }),
    users: one(users, {
        fields: [books.ownerId],
        references: [users.id]
    }),
    author: one(authors, {
        fields: [books.authorId],
        references: [authors.id]
    }),
    tags: many(booksToTags)
}))