import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

import { db } from './db/index.js';
import votesRouter from './routes/votes.js';
import commentsRouter from './routes/comments.js';

type Env = { Variables: { db: typeof db } };

const app = new Hono<Env>();

app.use('*', cors());

app.use('*', async (c, next) => {
  c.set('db', db);
  await next();
});

app.route('/', votesRouter);
app.route('/', commentsRouter);

app.get('/health', (c) => c.json({ ok: true }));

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 API on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
