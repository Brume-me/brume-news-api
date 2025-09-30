import { Hono } from 'hono';
import { serve } from '@hono/node-server';

import { db } from './db/index.js';
import votesRouter from './routes/votes.js';
import commentsRouter from './routes/comments.js';
import { withCors } from './middleware/cors.js';
import { ensureAnonId } from './middleware/anon-id.js';
import type { Env } from './types/env.js';

const app = new Hono<Env>();

app.use('*', withCors);
app.use('*', async (c, next) => {
  c.set('db', db);
  await next();
});
app.use('*', ensureAnonId);

app.route('/', votesRouter);
app.route('/', commentsRouter);

app.get('/health', (c) => c.json({ ok: true }));

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 API on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
