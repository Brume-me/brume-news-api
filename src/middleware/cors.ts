import { cors } from 'hono/cors';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

export const withCors = cors({
  origin: (origin) => {
    if (!origin) return FRONTEND_ORIGIN;
    return origin === FRONTEND_ORIGIN ? origin : '';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Requested-With', 'Idempotency-Key', 'X-CSRF-Token'],
  exposeHeaders: ['Set-Cookie']
});
