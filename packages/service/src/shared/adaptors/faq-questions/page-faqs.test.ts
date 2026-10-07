import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFaqQuestions } from './loader';
import { getPageFaqs } from './page-faqs';

vi.mock('./loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const tenant = makeTenant();

describe('getPageFaqs', () => {
  it('builds the faqs from the FAQ modules, in page order, with one request', async () => {
    mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

    const faqs = await getPageFaqs(
      [
        { id: 'faq-b', type: 'module_faq' },
        { id: 'cta-1', type: 'module_cta' },
        { id: 'faq-a', type: 'module_faq' },
      ],
      tenant,
    );

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(faqs).toEqual([
      {
        id: 'block-faq-1',
        question: 'How long does onboarding take?',
        answer: 'Most teams are live within a week.',
      },
    ]);
  });

  it('makes no FAQ-questions request when the page has no FAQ module', async () => {
    const faqs = await getPageFaqs(
      [{ id: 'cta-1', type: 'module_cta' }],
      tenant,
    );

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(faqs).toEqual([]);
  });
});
