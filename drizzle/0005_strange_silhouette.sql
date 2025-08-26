CREATE INDEX "idx_books_created_at" ON "books" USING btree ("created_at");
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");