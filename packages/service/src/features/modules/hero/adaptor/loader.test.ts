import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawHeroModule } from '#/testing/modules/fixtures';
import { makeRawPostCard } from '#/testing/pages/fixtures';

import { getHero } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
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
