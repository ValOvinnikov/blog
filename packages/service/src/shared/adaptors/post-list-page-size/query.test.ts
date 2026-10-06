import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postListPageSizeQuery } from './query';
import { toFirstPostListPageSize } from './transformer';

const dataset = [
  { _id: 'post-list-a', _type: 'module_postList', pageSize: 7 },
  { _id: 'post-list-b', _type: 'module_postList', pageSize: 12 },
  { _id: 'hero-a', _type: 'module_hero' },
];

async function pageSizeFor(moduleIds: string[]) {
  const raw = await evaluateGroqExpression(
    postListPageSizeQuery.query,
    dataset,
    null,
    { ids: moduleIds },
  );

  return toFirstPostListPageSize(moduleIds, postListPageSizeQuery.parse(raw));
}

describe('postListPageSizeQuery', () => {
  it('returns the page size when the post list is first', async () => {
    expect(await pageSizeFor(['post-list-a', 'hero-a'])).toBe(7);
  });

  it('returns the page size when the post list is second', async () => {
    expect(await pageSizeFor(['hero-a', 'post-list-a'])).toBe(7);
  });

  it('takes the first post list in page order', async () => {
    expect(await pageSizeFor(['post-list-b', 'post-list-a'])).toBe(12);
  });

  it('returns null when no module is a post list', async () => {
    expect(await pageSizeFor(['hero-a'])).toBeNull();
  });

  it('returns null for an empty modules list', async () => {
    expect(await pageSizeFor([])).toBeNull();
  });
});
