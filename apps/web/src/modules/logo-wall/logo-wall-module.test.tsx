import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_LOGO_ITEMS,
  MOCK_LOGO_WALL_HEADING,
} from '@web/testing/modules/logo-wall/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { LogoWallModule } from './logo-wall-module';

faker.seed(6011);

const MOCK_MODULE_ID = faker.string.uuid();

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

const MOCK_BASE_MODULE = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_LOGO_WALL_HEADING }),
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
};

const setup = customRenderAsync(LogoWallModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${LogoWallModule.name}/>`, () => {
  beforeEach(() => {
    getLogoWallModuleMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getLogoWallModuleMock.mockResolvedValue(
        okResult({ ...MOCK_BASE_MODULE, logos: MOCK_LOGO_ITEMS }),
      );

      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getLogoWallModuleMock).toHaveBeenCalledWith(
        MOCK_MODULE_ID,
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

  it('renders nothing when the fetch fails', async () => {
    getLogoWallModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
