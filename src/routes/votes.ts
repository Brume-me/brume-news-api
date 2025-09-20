import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, eq, sql } from 'drizzle-orm';
import { articleVotes } from '../db/schema.js';

type Env = { Variables: { db: any } };
const router = new Hono<Env>();

const parseArticleId = (s: string) => {
  const id = Number(s);
  if (!Number.isInteger(id) || id <= 0) throw new Error('invalid-article-id');
  return id;
};

const voteSchema = z.object({
  userHash: z.string().min(8).max(255),
  vote: z.enum(['upvote', 'downvote', 'none'])
});

router.get('/articles/:articleId/upvotes', async (c) => {
  const db = c.var.db;
  const articleId = parseArticleId(c.req.param('articleId'));

  const rows = await db
    .select({
      vote: articleVotes.vote,
      count: sql<number>`count(*)`.as('count')
    })
    .from(articleVotes)
    .where(eq(articleVotes.articleId, articleId))
    .groupBy(articleVotes.vote);

  return c.json(rows);
});

router.post('/articles/:articleId/upvotes', zValidator('json', voteSchema), async (c) => {
  const db = c.var.db;
  const articleId = parseArticleId(c.req.param('articleId'));
  const { userHash, vote } = c.req.valid('json');

  if (!vote) {
    await db
      .delete(articleVotes)
      .where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.userHash, userHash)));
    return c.json({ deleted: true }, 200);
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

  return c.json({ upvote: res[0] }, 201);
});

export default router;
