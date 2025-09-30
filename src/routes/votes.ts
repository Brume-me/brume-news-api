import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, eq, sql } from 'drizzle-orm';
import { articleVotes } from '../db/schema.js';
import type { Env } from '../types/env.js';

const voteSchema = z.object({
  vote: z.enum(['upvote', 'downvote']).optional()
});

const router = new Hono<Env>();

router.get('/articles/:articleId/votes', zValidator('query', z.object({})), async (c) => {
  const db = c.var.db;
  const articleId = c.req.param('articleId');
  const anonId = c.var.anonId;

  const rows = await db
    .select({
      vote: articleVotes.vote,
      count: sql<number>`count(*)`.as('count')
    })
    .from(articleVotes)
    .where(eq(articleVotes.articleId, articleId))
    .groupBy(articleVotes.vote);

  let upvotes = 0;
  let downvotes = 0;

  rows.forEach((row) => {
    if (row.vote === 'upvote') upvotes = Number(row.count);
    if (row.vote === 'downvote') downvotes = Number(row.count);
  });

  let userVote = null;
  const existing = await db
    .select({ vote: articleVotes.vote })
    .from(articleVotes)
    .where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.anonId, anonId)))
    .limit(1);

  if (existing.length) userVote = existing[0].vote;

  return c.json({ articleId, upvotes, downvotes, userVote });
});

router.post('/articles/:articleId/votes', zValidator('json', voteSchema), async (c) => {
  const db = c.var.db;
  const articleId = c.req.param('articleId');
  const { vote } = c.req.valid('json');
  const anonId = c.var.anonId;

  if (!vote) {
    await db.delete(articleVotes).where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.anonId, anonId)));
    return c.json({ deleted: true });
  }

  console.log({ articleId, anonId, vote });

  const res = await db
    .insert(articleVotes)
    .values({ articleId, anonId, vote })
    .onConflictDoUpdate({
      target: [articleVotes.articleId, articleVotes.anonId],
      set: { vote }
    })
    .returning({
      id: articleVotes.id,
      articleId: articleVotes.articleId,
      anonId: articleVotes.anonId,
      vote: articleVotes.vote
    });

  return c.json({ vote: res[0] }, 201);
});

export default router;
