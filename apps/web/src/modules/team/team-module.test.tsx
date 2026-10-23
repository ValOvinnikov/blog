import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
} from '@web/testing/modules/team/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { TeamModule } from './team-module';

const MODULE_ID = 'team-1';

const { getTeamModuleMock } = vi.hoisted(() => ({
  getTeamModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      team: { v1: { getTeamModule: getTeamModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const baseModule = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_TEAM_HEADING }),
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  showBios: false,
  showSocialLinks: false,
  layout: undefined,
};

const setup = customRenderAsync(TeamModule, {
  id: MODULE_ID,
});

describe(`<${TeamModule.name}/>`, () => {
  beforeEach(() => {
    getTeamModuleMock.mockReset();
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      getTeamModuleMock.mockResolvedValue(
        okResult({ ...baseModule, members: MOCK_TEAM_MEMBERS }),
      );

      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getTeamModuleMock).toHaveBeenCalledWith(
        MODULE_ID,
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved team member cards', () => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getTeamModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
