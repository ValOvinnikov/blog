import { service } from '@blog/service';

import { getCategoriesSafely } from './get-categories-safely';

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      categories: { v1: { getCategories: vi.fn() } },
    },
  },
}));

describe('getCategoriesSafely', () => {
  it('returns the categories from the service on success', async () => {
    const categories = [
      {
        id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: undefined,
        postCount: 3,
      },
    ];
    vi.mocked(service.entities.categories.v1.getCategories).mockResolvedValue({
      ok: true,
      data: categories,
    });

    await expect(getCategoriesSafely()).resolves.toEqual(categories);
  });

  it('falls back to an empty list and logs when the fetch resolves to a failure result', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.entities.categories.v1.getCategories).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(getCategoriesSafely()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('categories.fetch_failed'),
    );

    errorSpy.mockRestore();
  });
});
