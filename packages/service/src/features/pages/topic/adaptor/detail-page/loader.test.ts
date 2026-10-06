import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeRawTopicPage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTopicPage } from './loader';

vi.mock('@blog/service/shared/adaptors/faq-questions/loader', () => ({
  getFaqQuestions: vi.fn(),
}));

const mockFaqQuestions = vi.mocked(getFaqQuestions);

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTopicPage', () => {
  it('loads a topic page with no list module in modules[]', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage({ modules: [] }));

    const result = await getTopicPage('engineering', tenant);

    expect(result).toBeDefined();
  });

  it('takes the heading/supporting text from the referenced topic, not page_topic.title', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        topic: {
          _id: 'topic-1',
          title: 'Engineering',
          slug: 'engineering',
          description: 'Notes on building things.',
        },
      }),
    );

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.topic).toEqual({
      id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Notes on building things.',
    });
  });

  it('resolves seo from the authored value, with no fallback for an unauthored description', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        seo: makeRawSeo({ metaTitle: 'Engineering', metaDescription: null }),
      }),
    );

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.seo.title).toBe('Engineering');
    expect(result.seo.description).toBeUndefined();
  });

  it('maps the authored headingBlock straight through', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        headingBlock: makeRawHeadingBlock('Engineering, curated', {
          supportingText: 'Hand-picked reads.',
        }),
      }),
    );

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.headingBlock).toEqual({
      heading: 'Engineering, curated',
      supportingText: 'Hand-picked reads.',
    });
  });

  it('leaves supportingText undefined for an unset value, never falling back to the topic description', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        topic: {
          _id: 'topic-1',
          title: 'Engineering',
          slug: 'engineering',
          description: 'Notes on building things.',
        },
        headingBlock: makeRawHeadingBlock('Engineering, curated'),
      }),
    );

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.headingBlock).toEqual({
      heading: 'Engineering, curated',
      supportingText: undefined,
    });
  });

  it('leaves hero undefined when page_topic.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage({ hero: null }));

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_topic.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({ hero: { _id: 'hero-1', _type: 'module_heroBlog' } }),
    );

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_heroBlog' });
  });

  it('rejects when page_topic.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getTopicPage('engineering', tenant)).rejects.toThrow();
  });

  it('builds the faqs from the FAQ modules, in page order, with one request', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        modules: [
          { _id: 'faq-b', _type: 'module_faq' },
          { _id: 'cta-1', _type: 'module_cta' },
          { _id: 'faq-a', _type: 'module_faq' },
        ],
      }),
    );
    mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(result.faqs).toEqual([
      {
        id: 'block-faq-1',
        question: 'How long does onboarding take?',
        answer: 'Most teams are live within a week.',
      },
    ]);
  });

  it('makes no FAQ-questions request when the page has no FAQ module', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage({ modules: [] }));

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(result.faqs).toEqual([]);
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage());

    await getTopicPage('engineering', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'engineering' } }),
    );
  });

  it('resolves undefined, rather than rejecting, when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTopicPage('nonexistent', tenant);

    expect(result).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage());

    await getTopicPage('engineering', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_topic',
            't:tenant-a:template_topic',
            't:tenant-a:topic',
          ],
        }),
      }),
    );
  });
});
