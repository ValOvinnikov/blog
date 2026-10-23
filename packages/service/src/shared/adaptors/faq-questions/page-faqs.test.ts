import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import { mockCtaSlotView } from '@blog/service/testing/pages/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getFaqQuestions } from './loader';
import { getPageFaqs } from './page-faqs';

vi.mock('./loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const tenant = mockTenant();

describe(getPageFaqs, () => {
  it('builds the faqs from the FAQ modules in page order with one request', async () => {
    mockFaqQuestions.mockResolvedValueOnce([mockRawFaqModuleQuestions()]);

    const faqs = await getPageFaqs(
      [
        { id: 'faq-b', type: 'module_faq' },
        mockCtaSlotView(),
        { id: 'faq-a', type: 'module_faq' },
      ],
      tenant,
    );

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(faqs).toEqual([mockFaqView()]);
  });

  it('makes no FAQ-questions request when the page has no FAQ module', async () => {
    const faqs = await getPageFaqs([mockCtaSlotView()], tenant);

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(faqs).toEqual([]);
  });
});
