import { BRAND_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FaqModule } from './faq-module';

const REFUNDS_QUESTION = 'Do you offer refunds?';
const TRIAL_QUESTION = 'Is there a free trial?';

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

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Frequently asked questions' }),
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(FaqModule, {
  id: 'faq-1',
});

describe(`<${FaqModule.name}/>`, () => {
  beforeEach(() => {
    getFaqModuleMock.mockReset();
  });

  it('fetches the module by id with the tenant Sanity context', async () => {
    getFaqModuleMock.mockResolvedValue(
      okResult({ ...baseModule, questions: [] }),
    );

    await setup();

    expect(getFaqModuleMock).toHaveBeenCalledWith(
      'faq-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getFaqModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved questions as accordion triggers', async () => {
    const questions = [
      mockFaqQuestion({ id: 'faq-a', question: REFUNDS_QUESTION }),
      mockFaqQuestion({ id: 'faq-b', question: TRIAL_QUESTION }),
    ];
    getFaqModuleMock.mockResolvedValue(okResult({ ...baseModule, questions }));

    await setup();

    const refundsTrigger = screen.getByRole('button', {
      name: REFUNDS_QUESTION,
    });
    const trialTrigger = screen.getByRole('button', { name: TRIAL_QUESTION });
    expect(refundsTrigger).toBeVisible();
    expect(trialTrigger).toBeVisible();
  });
});
