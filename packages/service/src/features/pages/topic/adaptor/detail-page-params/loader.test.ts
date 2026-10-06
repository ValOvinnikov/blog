import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTopicParams } from './loader';
import { topicParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL, FR } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe('getTopicParams', () => {
  it('returns the slug and language entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'engineering', language: EN },
      { slug: 'techniek', language: NL },
    ]);

    const params = await getTopicParams(tenant, [EN, NL]);

    expect(params).toEqual([
      { slug: 'engineering', language: EN },
      { slug: 'techniek', language: NL },
    ]);
  });

  it('returns an empty array when there are no topic pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTopicParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getTopicParams(tenant, [EN]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_topic'] }),
      }),
    );
  });

  it('passes the live languages to the query', async () => {
    mockRun.mockResolvedValue([]);

    await getTopicParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { locales: [EN, NL] } }),
    );
  });
});

describe('topicParamsQuery', () => {
  it('restricts to the live languages', async () => {
    const dataset = [
      {
        _id: 'a',
        _type: 'page_topic',
        slug: { current: 'engineering' },
        language: EN,
      },
      {
        _id: 'b',
        _type: 'page_topic',
        slug: { current: 'techniek' },
        language: NL,
      },
      { _id: 'c', _type: 'page_topic', slug: { current: 'fr' }, language: FR },
    ];

    expect(
      await evaluateGroqExpression(topicParamsQuery.query, dataset, null, {
        locales: [EN, NL],
      }),
    ).toEqual([
      { slug: 'engineering', language: EN },
      { slug: 'techniek', language: NL },
    ]);
  });
});
