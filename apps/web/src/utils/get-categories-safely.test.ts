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
    vi.mocked(service.entities.categories.v1.getCategories).mockResolvedValue(
      categories,
    );

    await expect(getCategoriesSafely()).resolves.toEqual(categories);
  });

  it('falls back to an empty list and logs when the fetch throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.entities.categories.v1.getCategories).mockRejectedValue(
      new Error('boom'),
    );

    await expect(getCategoriesSafely()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to load categories:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
