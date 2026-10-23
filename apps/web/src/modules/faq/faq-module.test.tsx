import { BRAND_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const getRequestContextMock = vi.mocked(getRequestContext);

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
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getFaqModule with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getFaqModuleMock.mockResolvedValue(
      okResult({ ...baseModule, questions: [] }),
    );

    await setup();

    expect(getFaqModuleMock).toHaveBeenCalledWith('faq-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getFaqModuleMock.mockResolvedValue(errorResult(new Error('boom')));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved questions as accordion triggers', async () => {
    const questions = [
      makeFaqQuestion({ id: 'faq-a', question: REFUNDS_QUESTION }),
      makeFaqQuestion({ id: 'faq-b', question: TRIAL_QUESTION }),
    ];
    getFaqModuleMock.mockResolvedValue(okResult({ ...baseModule, questions }));

    await setup();

    expect(
      screen.getByRole('button', { name: REFUNDS_QUESTION }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: TRIAL_QUESTION })).toBeVisible();
  });
});
