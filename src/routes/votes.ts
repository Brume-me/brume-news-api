import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, eq, sql } from 'drizzle-orm';
import type { DB } from '../db/index.js';
import { articleVotes } from '../db/schema.js';

type Env = { Variables: { db: DB } };

const voteSchema = z.object({
  userHash: z.string().min(8).max(255),
  vote: z.enum(['upvote', 'downvote']).optional()
});

const router = new Hono<Env>();

router.get(
  '/articles/:articleId/votes',
  zValidator('query', z.object({ userHash: z.string().min(8).max(255).optional() })),
  async (c) => {
    const db = c.var.db;
    const articleId = c.req.param('articleId');
    const { userHash } = c.req.valid('query');

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
    if (userHash) {
      const existing = await db
        .select({ vote: articleVotes.vote })
        .from(articleVotes)
        .where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.userHash, userHash)))
        .limit(1);
      if (existing.length) userVote = existing[0].vote;
    }

    return c.json({ articleId, upvotes, downvotes, userVote });
  }
);

router.post('/articles/:articleId/votes', zValidator('json', voteSchema), async (c) => {
  const db = c.var.db;
  const articleId = c.req.param('articleId');
  const { userHash, vote } = c.req.valid('json');

  if (!vote) {
    await db
      .delete(articleVotes)
      .where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.userHash, userHash)));
    return c.json({ deleted: true });
  }

  const res = await db
    .insert(articleVotes)
    .values({ articleId, userHash, vote })
    .onConflictDoUpdate({
      target: [articleVotes.articleId, articleVotes.userHash],
      set: { vote }
    })
    .returning({
      id: articleVotes.id,
      articleId: articleVotes.articleId,
      userHash: articleVotes.userHash,
      vote: articleVotes.vote
    });

  return c.json({ vote: res[0] }, 201);
});

export default router;
