import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import type { DB } from '../db/index.js';
import { comments } from '../db/schema.js';

type Env = { Variables: { db: DB } };

const router = new Hono<Env>();

const commentSchema = z.object({
  userHash: z.string().min(8).max(255),
  comment: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: 'Comment cannot be empty' })
});

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

router.get('/articles/:articleId/comments', zValidator('query', paginationQuery), async (c) => {
  const db = c.var.db;
  const articleId = c.req.param('articleId');
  const { page, pageSize } = c.req.valid('query');
  const offset = (page - 1) * pageSize;

  const data = await db
    .select({
      id: comments.id,
      articleId: comments.articleId,
      userHash: comments.userHash,
      comment: comments.comment,
      createdAt: comments.createdAt
    })
    .from(comments)
    .where(eq(comments.articleId, articleId))
    .orderBy(sql`${comments.createdAt} DESC`)
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.articleId, articleId));

  return c.json({ articleId, page, pageSize, total: Number(count), data });
});

router.post('/articles/:articleId/comments', zValidator('json', commentSchema), async (c) => {
  const db = c.var.db;
  const articleId = c.req.param('articleId');
  const { userHash, comment } = c.req.valid('json');

  const res = await db.insert(comments).values({ articleId, userHash, comment }).returning({
    id: comments.id,
    articleId: comments.articleId,
    userHash: comments.userHash,
    comment: comments.comment,
    createdAt: comments.createdAt
  });

  return c.json({ comment: res[0] }, 201);
});

export default router;
