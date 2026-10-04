import { BRAND_VARIANT } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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
    getFaqModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, questions: [] },
    });

    await setup();

    expect(getFaqModuleMock).toHaveBeenCalledWith('faq-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getFaqModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved questions as accordion triggers', async () => {
    const questions = [
      makeFaqQuestion({ id: 'faq-a', question: 'Do you offer refunds?' }),
      makeFaqQuestion({ id: 'faq-b', question: 'Is there a free trial?' }),
    ];
    getFaqModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, questions },
    });

    await setup();

    expect(
      screen.getByRole('button', { name: 'Do you offer refunds?' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Is there a free trial?' }),
    ).toBeVisible();
  });
});
