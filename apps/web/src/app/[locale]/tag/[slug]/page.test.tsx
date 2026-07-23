import { generateStaticParams } from './page';

const { getTagParamsMock } = vi.hoisted(() => ({
  getTagParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagParams: getTagParamsMock } },
    },
  },
}));

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: () => null,
}));

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn().mockResolvedValue({}),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

describe('TagDetailPage generateStaticParams', () => {
  it('returns the tag slugs on success', async () => {
    getTagParamsMock.mockResolvedValue([
      { slug: 'typescript' },
      { slug: 'react' },
    ]);

    const params = await generateStaticParams();

    expect(params).toEqual([{ slug: 'typescript' }, { slug: 'react' }]);
  });

  it('returns an empty array when the fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagParamsMock.mockRejectedValue(new Error('boom'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});
