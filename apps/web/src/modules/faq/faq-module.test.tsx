import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { FaqModule } from './faq-module';

const { getFaqModuleMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getFaqModuleMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      faq: { v1: { getFaqModule: getFaqModuleMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Frequently asked questions' }),
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(FaqModule, {
  id: 'faq-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${FaqModule.name}/>`, () => {
  beforeEach(() => {
    getFaqModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getFaqModule with the module id and the tenant Sanity context resolved from the tenant slug', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getFaqModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, questions: [] },
    });

    await setup();

    expect(getFaqModuleMock).toHaveBeenCalledWith('faq-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getFaqModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the questions degrade to an empty list, never an empty landmark with a dangling aria-labelledby', async () => {
    getFaqModuleMock.mockResolvedValue({
      ok: true,
      data: { ...baseModule, questions: [] },
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
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Is there a free trial?' }),
    ).toBeInTheDocument();
  });
});
