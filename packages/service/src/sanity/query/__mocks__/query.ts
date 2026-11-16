import type * as QueryModule from '@shinefold/service/sanity/query/query';

const actual = await vi.importActual<typeof QueryModule>(
  '@shinefold/service/sanity/query/query',
);

export const { q } = actual;

export const runQuery = vi.fn();
