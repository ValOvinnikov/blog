import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_LOGO_ITEMS,
  MOCK_LOGO_WALL_HEADING,
} from '@web/testing/modules/logo-wall/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { LogoWallModule } from './logo-wall-module';

const MODULE_ID = 'logo-wall-1';

const { getLogoWallModuleMock } = vi.hoisted(() => ({
  getLogoWallModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      logoWall: { v1: { getLogoWallModule: getLogoWallModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_LOGO_WALL_HEADING }),
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(LogoWallModule, {
  id: MODULE_ID,
});

describe(`<${LogoWallModule.name}/>`, () => {
  beforeEach(() => {
    getLogoWallModuleMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getLogoWallModuleMock.mockResolvedValue(
        okResult({ ...baseModule, logos: MOCK_LOGO_ITEMS }),
      );

      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getLogoWallModuleMock).toHaveBeenCalledWith(
        MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved logos', () => {
      MOCK_LOGO_ITEMS.forEach((logo) => {
        const logoImage = screen.getByRole('img', { name: logo.name });
        expect(logoImage).toBeVisible();
      });
    });
  });

  it('renders nothing when a logo image fails to resolve', async () => {
    getLogoWallModuleMock.mockResolvedValue(
      errorResult(new Error('Logo "Acme Corp"\'s image failed to resolve.')),
    );

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
