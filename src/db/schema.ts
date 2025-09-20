import { pgTable, serial, varchar, integer, text, pgEnum, unique, timestamp } from 'drizzle-orm/pg-core';

export const voteEnum = pgEnum('vote_type', ['upvote', 'downvote']);

export const articleVotes = pgTable(
  'article_votes',
  {
    id: serial('id').primaryKey(),
    vote: voteEnum('vote'),
    articleId: integer('article_id').notNull(),
    userHash: varchar('user_hash', { length: 255 }).notNull()
  },
  (t) => ({
    uqArticleUser: unique('article_votes_article_id_user_hash_uq').on(t.articleId, t.userHash)
  })
);

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  comment: text('comment').notNull(),
  articleId: integer('article_id').notNull(),
  userHash: varchar('user_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
