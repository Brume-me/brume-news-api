import { pgTable, varchar, text, timestamp, uniqueIndex, primaryKey, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const articleStatus = pgEnum('article_status', ['draft', 'published', 'archived']);
export const commentStatus = pgEnum('comment_status', ['pending', 'approved', 'rejected', 'spam']);

export const categories = pgTable(
  'categories',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    slugUq: uniqueIndex('categories_slug_uq').on(t.slug)
  })
);

export const articles = pgTable(
  'articles',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 200 }).notNull(),
    title: varchar('title', { length: 300 }).notNull(),
    summary: text('summary'),
    body: text('body'),
    status: articleStatus('status').notNull().default('published'),
    primaryCategoryId: varchar('primary_category_id', { length: 36 })
      .notNull()
      .references(() => categories.id),
    authorName: varchar('author_name', { length: 120 }),
    heroUrl: text('hero_url'),
    heroAlt: text('hero_alt'),
    heroCredit: text('hero_credit'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    slugUq: uniqueIndex('articles_slug_uq').on(t.slug),
    pubIdx: index('articles_published_at_idx').on(t.publishedAt)
  })
);

export const article_categories = pgTable(
  'article_categories',
  {
    articleId: varchar('article_id', { length: 36 })
      .notNull()
      .references(() => articles.id),
    categoryId: varchar('category_id', { length: 36 })
      .notNull()
      .references(() => categories.id)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.categoryId], name: 'article_categories_pk' })
  })
);

export const comments = pgTable(
  'comments',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    articleId: varchar('article_id', { length: 36 })
      .notNull()
      .references(() => articles.id),
    authorName: varchar('author_name', { length: 120 }),
    body: text('body').notNull(),
    status: commentStatus('status').notNull().default('pending'),
    ipHash: varchar('ip_hash', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    articleIdx: index('comments_article_id_idx').on(t.articleId),
    statusIdx: index('comments_status_idx').on(t.status)
  })
);
