import { relations } from "drizzle-orm";
import { decimal, index, integer, pgTable, primaryKey, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ------------------------Tables------------------------

// Users
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 30 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    resetPassOtp: varchar('resetPassOtp', { length: 6 }),
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
    price: integer('price').notNull(),
    thumbnail: text('thumbnail'),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'no action' }).notNull(),
    authorId: integer('author_id').references(() => authors.id, { onDelete: 'set null' }),
    ownerId: integer('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
},
    (t) => [
        index('idx_books_category_id').on(t.categoryId),
        index('idx_books_owner_id').on(t.ownerId),
    ]
);

// Books to Tags (Many-to-Many)
export const booksToTags = pgTable('books_to_tags', {
    bookId: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
},
    (t) => [
        primaryKey({ columns: [t.bookId, t.tagId] }),
        index('idx_books_to_tags_tag_id').on(t.tagId)
    ]
);




// ------------------------Relations-------------------------

// Category Relation (One-to-Many)
export const categoriesRelations = relations(categories, ({ many }) => ({
    books: many(books),
}));

// Author Relation (One-to-Many)
export const authorsRelations = relations(authors, ({ many }) => ({
    books: many(books),
}));

// User Relation (One-to-Many)
export const usersRelations = relations(users, ({ many }) => ({
    books: many(books),
}));

// Tag Relation (Many-to-Many)
export const tagsRelations = relations(tags, ({ many }) => ({
    booksToTags: many(booksToTags),
}));

// Pivot table relations
export const booksToTagsRelations = relations(booksToTags, ({ one }) => ({
    book: one(books, {
        fields: [booksToTags.bookId],
        references: [books.id],
    }),
    tag: one(tags, {
        fields: [booksToTags.tagId],
        references: [tags.id],
    }),
}));


// Book Relations
export const booksRelations = relations(books, ({ one, many }) => ({
    category: one(categories, {
        fields: [books.categoryId],
        references: [categories.id],
    }),
    owner: one(users, {
        fields: [books.ownerId],
        references: [users.id]
    }),
    author: one(authors, {
        fields: [books.authorId],
        references: [authors.id]
    }),
    tags: many(booksToTags),
}))