import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { MOCK_TENANT_PROJECT_ID } from '@blog/service/testing/tenant';

import { isr } from './isr';

const POSTS_TAG = 'posts';
const AUTHOR_TAG = 'author';
const LIVE_CONTENT_ON = '1';

const mockEnv = vi.hoisted(() => ({
  SANITY_LIVE_CONTENT: undefined as '1' | undefined,
}));

vi.mock('@blog/service/utils/env/env', () => ({ env: mockEnv }));

function taggedCache(tags: string[]) {
  return { next: { revalidate: SANITY_CONTENT_REVALIDATE_SECONDS, tags } };
}

describe(isr, () => {
  afterEach(() => {
    mockEnv.SANITY_LIVE_CONTENT = undefined;
    vi.unstubAllEnvs();
  });

  it('rejects a call site that omits the project id at compile time', () => {
    // @ts-expect-error -- `scopeProjectId` is required; there is no unscoped form that silently shares a cache tag across tenants.
    isr([POSTS_TAG, AUTHOR_TAG]);
  });

  it('scopes every tag to the project', () => {
    const options = isr([POSTS_TAG, AUTHOR_TAG], MOCK_TENANT_PROJECT_ID);

    expect(options).toEqual(
      taggedCache([MOCK_POSTS_CACHE_TAG, MOCK_AUTHOR_CACHE_TAG]),
    );
  });

  it('accepts a single tag string the same as an array of one', () => {
    const options = isr(POSTS_TAG, MOCK_TENANT_PROJECT_ID);

    expect(options).toEqual(taggedCache([MOCK_POSTS_CACHE_TAG]));
  });

  it('bypasses the fetch cache in development with live content on', () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockEnv.SANITY_LIVE_CONTENT = LIVE_CONTENT_ON;

    const options = isr(POSTS_TAG, MOCK_TENANT_PROJECT_ID);

    expect(options).toEqual({ cache: 'no-store' });
  });

  it.each([
    { nodeEnv: 'development', liveContent: undefined },
    { nodeEnv: 'production', liveContent: LIVE_CONTENT_ON },
  ] as const)(
    'keeps the tagged cache in $nodeEnv with live content $liveContent',
    ({ nodeEnv, liveContent }) => {
      vi.stubEnv('NODE_ENV', nodeEnv);
      mockEnv.SANITY_LIVE_CONTENT = liveContent;

      const options = isr(POSTS_TAG, MOCK_TENANT_PROJECT_ID);

      expect(options).toEqual(taggedCache([MOCK_POSTS_CACHE_TAG]));
    },
  );
});
