import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHeroModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getHero } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getHero', () => {
  it('resolves the hero using the configured featured post', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawHeroModule({
          featuredPost: makeRawPostCard({ _id: 'featured-ref' }),
        }),
      )
      .mockResolvedValueOnce(null);

    const hero = await getHero('hero-1');

    expect(hero.title).toBe('Hello World');
    expect(hero.primaryAction?.href).toBe('/blog/hello-world');
  });

  it('propagates when the hero document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHero('missing')).rejects.toThrow();
  });
});
