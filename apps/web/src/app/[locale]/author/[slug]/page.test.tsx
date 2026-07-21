import { describe, expect, it, vi } from 'vitest';

import { generateStaticParams } from './page';

const { getAuthorParamsMock } = vi.hoisted(() => ({
  getAuthorParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: { v1: { getAuthorParams: getAuthorParamsMock } },
    },
  },
}));

vi.mock('@web/components/pages/author-page', () => ({
  AuthorPage: () => null,
}));

vi.mock('@web/metadata/author-metadata', () => ({
  buildAuthorMetadata: vi.fn().mockResolvedValue({}),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

describe('AuthorDetailPage generateStaticParams', () => {
  it('returns the author slugs on success', async () => {
    getAuthorParamsMock.mockResolvedValue([
      { slug: 'jane-doe' },
      { slug: 'john-smith' },
    ]);

    const params = await generateStaticParams();

    expect(params).toEqual([{ slug: 'jane-doe' }, { slug: 'john-smith' }]);
  });

  it('returns an empty array when the fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getAuthorParamsMock.mockRejectedValue(new Error('boom'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});
