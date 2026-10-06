import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFaqQuestions } from './loader';
import { withPageFaqs } from './page-faqs';

vi.mock('./loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const tenant = makeTenant();

describe('withPageFaqs', () => {
  it('adds the faqs from the FAQ modules, in page order, with one request', async () => {
    mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);
    const modules = [
      { id: 'faq-b', type: 'module_faq' as const },
      { id: 'cta-1', type: 'module_cta' as const },
      { id: 'faq-a', type: 'module_faq' as const },
    ];

    const page = await withPageFaqs({ id: 'page-1', modules }, tenant);

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(page).toEqual({
      id: 'page-1',
      modules,
      faqs: [
        {
          id: 'block-faq-1',
          question: 'How long does onboarding take?',
          answer: 'Most teams are live within a week.',
        },
      ],
    });
  });

  it('adds no faqs and makes no request when the page has no FAQ module', async () => {
    const page = await withPageFaqs(
      { modules: [{ id: 'cta-1', type: 'module_cta' as const }] },
      tenant,
    );

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(page?.faqs).toEqual([]);
  });

  it('resolves undefined without a request when there is no page', async () => {
    expect(await withPageFaqs(undefined, tenant)).toBeUndefined();
    expect(mockFaqQuestions).not.toHaveBeenCalled();
  });
});
