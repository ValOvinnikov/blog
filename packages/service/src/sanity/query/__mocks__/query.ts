import type * as QueryModule from '@blog/service/sanity/query/query';

const actual = await vi.importActual<typeof QueryModule>(
  '@blog/service/sanity/query/query',
);

export const { q } = actual;

export const runQuery = vi.fn();
