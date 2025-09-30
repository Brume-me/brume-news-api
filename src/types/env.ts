import type { DB } from '../db/index.js';

export type Env = {
  Variables: {
    db: DB;
    anonId: string;
  };
};
