import { getCookie, setCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';
import { ulid } from 'ulid';

export const ensureAnonId = async (c: Context, next: Next) => {
  const url = new URL(c.req.url);
  const isLocalHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  let aid = getCookie(c, 'brume_aid');
  if (!aid) {
    aid = ulid();
    setCookie(c, 'brume_aid', aid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !isLocalHttp,
      path: '/',
      maxAge: 60 * 60 * 24 * 180
    });
  }

  c.set('anonId', aid);
  await next();
};
