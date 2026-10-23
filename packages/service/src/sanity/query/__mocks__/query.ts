import type * as TQueryModule from '@blog/service/sanity/query/query';

const actual = await vi.importActual<typeof TQueryModule>(
  '@blog/service/sanity/query/query',
);

export const { q } = actual;
export const runQuery = vi.fn();
