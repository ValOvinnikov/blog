import { errorResult } from '@blog/utils';
import { customRenderAsync } from '@web/testing/custom-render';
import { MOCK_CTA_MODULE_ID } from '@web/testing/modules/cta/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { CtaModule } from './cta-module';

const { getCtaMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const setup = customRenderAsync(CtaModule, {
  id: MOCK_CTA_MODULE_ID,
});

describe(`<${CtaModule.name}/>`, () => {
  let container: HTMLElement;

  beforeEach(async () => {
    getCtaMock.mockReset();
    getCtaMock.mockResolvedValue(errorResult(MOCK_ERROR));
    ({ container } = await setup());
  });

  it('renders nothing when the fetch fails', () => {
    expect(container).toBeEmptyDOMElement();
  });

  it('fetches the module with the resolved tenant Sanity context', () => {
    expect(getCtaMock).toHaveBeenCalledWith(
      MOCK_CTA_MODULE_ID,
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });
});
