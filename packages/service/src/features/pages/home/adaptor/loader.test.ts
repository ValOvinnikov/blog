import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getHomePage } from './loader';

vi.mock('@blog/service/shared/adaptors/faq-questions/loader', () => ({
  getFaqQuestions: vi.fn(),
}));

const mockFaqQuestions = vi.mocked(getFaqQuestions);

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getHomePage', () => {
  it('maps the thin page_home document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawHomePage());

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toEqual({
      id: 'hero-1',
      type: 'module_heroBlog',
    });
    expect(page.modules).toEqual([
      { id: 'post-latest-1', type: 'module_postLatest' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('maps a headingBlock heading with no hero to an undefined hero', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        hero: null,
        headingBlock: makeRawHeadingBlock('Welcome'),
      }),
    );

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toBeUndefined();
    expect(page.headingBlock.heading).toBe('Welcome');
    expect(page.headingBlock.supportingText).toBeUndefined();
  });

  it('maps both a hero and a headingBlock heading when both are authored', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        headingBlock: makeRawHeadingBlock('Welcome', {
          supportingText: 'A subtitle',
        }),
      }),
    );

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toEqual({ id: 'hero-1', type: 'module_heroBlog' });
    expect(page.headingBlock.heading).toBe('Welcome');
    expect(page.headingBlock.supportingText).toBe('A subtitle');
  });

  it('rejects when page_home.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getHomePage(tenant)).rejects.toThrow();
  });

  it('resolves seo from the authored value, with no fallback for an unauthored description', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        seo: makeRawSeo({ metaTitle: 'Home', metaDescription: null }),
      }),
    );

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.seo.title).toBe('Home');
    expect(page.seo.description).toBeUndefined();
    expect(page.seo.ogTitle).toBeUndefined();
  });

  it('builds the faqs from the FAQ modules, in page order, with one request', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        modules: [
          { _id: 'faq-b', _type: 'module_faq' },
          { _id: 'cta-1', _type: 'module_cta' },
          { _id: 'faq-a', _type: 'module_faq' },
        ],
      }),
    );
    mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a page');

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(page.faqs).toEqual([
      {
        id: 'block-faq-1',
        question: 'How long does onboarding take?',
        answer: 'Most teams are live within a week.',
      },
    ]);
  });

  it('makes no FAQ-questions request when the page has no FAQ module', async () => {
    mockRun.mockResolvedValueOnce(makeRawHomePage());

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a page');

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(page.faqs).toEqual([]);
  });

  it('lists the Home translations, counting a Home with no language as the default', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
      }),
    );

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.translations).toEqual([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
  });

  it('resolves undefined, rather than rejecting, when no page_home document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getHomePage(tenant);

    expect(page).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawHomePage());

    await getHomePage(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:homePage'],
        }),
      }),
    );
  });
});
