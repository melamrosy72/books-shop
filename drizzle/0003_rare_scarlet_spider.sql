ALTER TABLE "authors" ADD CONSTRAINT "authors_name_unique" UNIQUE("name");
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");