import { errorResult, okResult } from '@shinefold/utils';
import { CTA_LOG } from '@web/constants/cta';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_MODULE_ID,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SECTION_STYLE_OVERRIDE_CASES } from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { CtaModule } from './cta-module';

const { getCtaMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
}));

vi.mock('@shinefold/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

const MOCK_CTA_MODULE = mockCtaModuleData();

const setup = customRenderAsync(CtaModule, {
  id: MOCK_CTA_MODULE_ID,
});

describe(`<${CtaModule.name}/>`, () => {
  describe('when the fetch succeeds', () => {
    beforeEach(async () => {
      getCtaMock.mockResolvedValue(okResult(MOCK_CTA_MODULE));
      await setup();
    });

    it('fetches the module with the resolved tenant Sanity context', () => {
      expect(getCtaMock).toHaveBeenCalledWith(
        MOCK_CTA_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved module', () => {
      const region = screen.getByRole('region', {
        name: MOCK_CTA_MODULE.headingBlock.heading,
      });

      expect(region).toBeVisible();
    });
  });

  it.each(MOCK_SECTION_STYLE_OVERRIDE_CASES)(
    'scopes the section to $title',
    async ({ overrides }) => {
      getCtaMock.mockResolvedValue(okResult(mockCtaModuleData(overrides)));

      await setup();

      expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
        overrides,
      );
    },
  );

  it('logs and renders nothing when the fetch fails', async () => {
    getCtaMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      CTA_LOG.MODULE_FETCH_FAILED,
      { id: MOCK_CTA_MODULE_ID, error: MOCK_ERROR },
    );
  });
});
