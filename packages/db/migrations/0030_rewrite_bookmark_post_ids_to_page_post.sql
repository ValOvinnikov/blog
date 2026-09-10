-- Custom SQL migration file, put your code below! --
-- `page_post` absorbs `blog_post` (a Sanity `_type` cannot change in
-- place), so every post's Sanity `_id` moves behind a fixed `page_post-`
-- prefix. `bookmarks.post_id` stores that id as plain text and needs the
-- same rewrite; the WHERE clause makes a second run a no-op.
UPDATE "bookmarks"
SET "post_id" = 'page_post-' || "post_id"
WHERE "post_id" NOT LIKE 'page_post-%';
