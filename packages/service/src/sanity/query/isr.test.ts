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
    expect(isr(['posts', 'author'], 'tenant-a')).toEqual({
      next: {
        revalidate: 3600,
        tags: ['t:tenant-a:posts', 't:tenant-a:author'],
      },
    });
  });

  it('accepts a single tag string the same as an array of one', () => {
    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });

  it('bypasses the fetch cache in development when SANITY_LIVE_CONTENT is set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockEnv.SANITY_LIVE_CONTENT = '1';

    expect(isr('posts', 'tenant-a')).toEqual({ cache: 'no-store' });
  });

  it('keeps the tagged cache in development without the flag', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });

  it('ignores the flag in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockEnv.SANITY_LIVE_CONTENT = '1';

    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });
});
