import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import { mockCtaSlotView } from '@blog/service/testing/pages/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFaqQuestions } from './loader';
import { getPageFaqs } from './page-faqs';

vi.mock('./loader');

faker.seed(6021);

const MOCK_FIRST_FAQ_MODULE_ID = faker.string.uuid();
const MOCK_SECOND_FAQ_MODULE_ID = faker.string.uuid();
const MOCK_TENANT = mockTenant();

describe(getPageFaqs, () => {
  it('builds the faqs from the FAQ modules in page order in one request', async () => {
    vi.mocked(getFaqQuestions).mockResolvedValueOnce([
      mockRawFaqModuleQuestions(),
    ]);

    const faqs = await getPageFaqs(
      [
        { id: MOCK_FIRST_FAQ_MODULE_ID, type: 'module_faq' },
        mockCtaSlotView(),
        { id: MOCK_SECOND_FAQ_MODULE_ID, type: 'module_faq' },
      ],
      MOCK_TENANT,
    );

    expect(getFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      [MOCK_FIRST_FAQ_MODULE_ID, MOCK_SECOND_FAQ_MODULE_ID],
      MOCK_TENANT,
    );
    expect(faqs).toEqual([mockFaqView()]);
  });

  it('makes no FAQ request when the page has no FAQ module', async () => {
    const faqs = await getPageFaqs([mockCtaSlotView()], MOCK_TENANT);

    expect(getFaqQuestions).not.toHaveBeenCalled();
    expect(faqs).toEqual([]);
  });
});
