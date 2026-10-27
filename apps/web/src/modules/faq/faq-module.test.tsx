import { BRAND_VARIANT } from '@blog/config';
import type { TFaqModule } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FaqModule } from './faq-module';

const { getFaqModuleMock } = vi.hoisted(() => ({
  getFaqModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      faq: { v1: { getFaqModule: getFaqModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(31);

const MOCK_FAQ_MODULE_ID = faker.string.uuid();
const MOCK_FIRST_QUESTION = faker.lorem.sentence();
const MOCK_SECOND_QUESTION = faker.lorem.sentence();

const mockFaqModule = (overrides: Partial<TFaqModule> = {}): TFaqModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock(),
  questions: [],
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(FaqModule, {
  id: MOCK_FAQ_MODULE_ID,
});

describe(`<${FaqModule.name}/>`, () => {
  beforeEach(() => {
    getFaqModuleMock.mockReset();
    getFaqModuleMock.mockResolvedValue(okResult(mockFaqModule()));
  });

  it('fetches the module by id with the tenant Sanity context', async () => {
    await setup();

    expect(getFaqModuleMock).toHaveBeenCalledWith(
      MOCK_FAQ_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getFaqModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved questions as accordion triggers', async () => {
    getFaqModuleMock.mockResolvedValue(
      okResult(
        mockFaqModule({
          questions: [
            mockFaqQuestion({
              id: faker.string.uuid(),
              question: MOCK_FIRST_QUESTION,
            }),
            mockFaqQuestion({
              id: faker.string.uuid(),
              question: MOCK_SECOND_QUESTION,
            }),
          ],
        }),
      ),
    );

    await setup();

    const firstTrigger = screen.getByRole('button', {
      name: MOCK_FIRST_QUESTION,
    });
    const secondTrigger = screen.getByRole('button', {
      name: MOCK_SECOND_QUESTION,
    });

    expect(firstTrigger).toBeVisible();
    expect(secondTrigger).toBeVisible();
  });
});
