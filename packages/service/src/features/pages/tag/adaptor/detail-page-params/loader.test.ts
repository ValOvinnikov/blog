import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTagParams } from './loader';
import { tagParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL, FR } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe('getTagParams', () => {
  it('returns the slug and language entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'typescript', language: EN },
      { slug: 'typescript-nl', language: NL },
    ]);

    const params = await getTagParams(tenant, [EN, NL]);

    expect(params).toEqual([
      { slug: 'typescript', language: EN },
      { slug: 'typescript-nl', language: NL },
    ]);
  });

  it('returns an empty array when there are no tag pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTagParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getTagParams(tenant, [EN]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_tag'] }),
      }),
    );
  });

  it('passes the live languages to the query', async () => {
    mockRun.mockResolvedValue([]);

    await getTagParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { liveLocales: [EN, NL] } }),
    );
  });
});

describe('tagParamsQuery', () => {
  it('restricts to the live languages', async () => {
    const dataset = [
      {
        _id: 'a',
        _type: 'page_tag',
        slug: { current: 'typescript' },
        language: EN,
      },
      {
        _id: 'b',
        _type: 'page_tag',
        slug: { current: 'typescript-nl' },
        language: NL,
      },
      { _id: 'c', _type: 'page_tag', slug: { current: 'fr' }, language: FR },
    ];

    expect(
      await evaluateGroqExpression(tagParamsQuery.query, dataset, null, {
        liveLocales: [EN, NL],
      }),
    ).toEqual([
      { slug: 'typescript', language: EN },
      { slug: 'typescript-nl', language: NL },
    ]);
  });
});
