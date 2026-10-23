import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { MOCK_TENANT_PROJECT_ID } from '@blog/service/testing/tenant';

import { isr } from './isr';

const mockEnv = vi.hoisted(() => ({
  SANITY_LIVE_CONTENT: undefined as '1' | undefined,
}));

vi.mock('@blog/service/utils/env/env', () => ({ env: mockEnv }));

describe(isr, () => {
  afterEach(() => {
    mockEnv.SANITY_LIVE_CONTENT = undefined;
    vi.unstubAllEnvs();
  });

  it('rejects a call site that omits the project id at compile time', () => {
    // @ts-expect-error -- `scopeProjectId` is required; there is no unscoped form that silently shares a cache tag across tenants.
    isr(['posts', 'author']);
  });

  it('prefixes every tag with t:<projectId>:', () => {
    expect(isr(['posts', 'author'], MOCK_TENANT_PROJECT_ID)).toEqual({
      next: {
        revalidate: 3600,
        tags: [MOCK_POSTS_CACHE_TAG, MOCK_AUTHOR_CACHE_TAG],
      },
    });
  });

  it('accepts a single tag string the same as an array of one', () => {
    expect(isr('posts', MOCK_TENANT_PROJECT_ID)).toEqual({
      next: { revalidate: 3600, tags: [MOCK_POSTS_CACHE_TAG] },
    });
  });

  it('bypasses the fetch cache in development when SANITY_LIVE_CONTENT is set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockEnv.SANITY_LIVE_CONTENT = '1';

    expect(isr('posts', MOCK_TENANT_PROJECT_ID)).toEqual({ cache: 'no-store' });
  });

  it('keeps the tagged cache in development without the flag', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(isr('posts', MOCK_TENANT_PROJECT_ID)).toEqual({
      next: { revalidate: 3600, tags: [MOCK_POSTS_CACHE_TAG] },
    });
  });

  it('ignores the flag in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockEnv.SANITY_LIVE_CONTENT = '1';

    expect(isr('posts', MOCK_TENANT_PROJECT_ID)).toEqual({
      next: { revalidate: 3600, tags: [MOCK_POSTS_CACHE_TAG] },
    });
  });
});
