import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_MODULE_ID,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { CtaModule } from './cta-module';

const { getCtaMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const MOCK_CTA_MODULE = mockCtaModuleData();

const setup = customRenderAsync(CtaModule, {
  id: MOCK_CTA_MODULE_ID,
});

describe(`<${CtaModule.name}/>`, () => {
  beforeEach(() => {
    getCtaMock.mockReset();
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    getCtaMock.mockResolvedValue(okResult(MOCK_CTA_MODULE));

    await setup();

    expect(getCtaMock).toHaveBeenCalledWith(
      MOCK_CTA_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the resolved module', async () => {
    getCtaMock.mockResolvedValue(okResult(MOCK_CTA_MODULE));

    await setup();

    const region = screen.getByRole('region', {
      name: MOCK_CTA_MODULE.headingBlock.heading,
    });

    expect(region).toBeVisible();
  });

  it('renders nothing when the fetch fails', async () => {
    getCtaMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
