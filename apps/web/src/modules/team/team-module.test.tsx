import { faker } from '@faker-js/faker';
import { errorResult, okResult } from '@shinefold/utils';
import { TEAM_LOG } from '@web/constants/team';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_TEAM_MEMBERS,
  mockTeamModule,
} from '@web/testing/modules/team/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SECTION_STYLE_OVERRIDE_CASES } from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { TeamModule } from './team-module';

const { getTeamModuleMock } = vi.hoisted(() => ({
  getTeamModuleMock: vi.fn(),
}));

vi.mock('@shinefold/service', () => ({
  service: {
    modules: {
      team: { v1: { getTeamModule: getTeamModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

faker.seed(12);

const MOCK_MODULE_ID = faker.string.uuid();

const setup = customRenderAsync(TeamModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${TeamModule.name}/>`, () => {
  beforeEach(() => {
    getTeamModuleMock.mockResolvedValue(okResult(mockTeamModule()));
  });

  describe('when the module resolves', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module by id with the tenant Sanity context', () => {
      expect(getTeamModuleMock).toHaveBeenCalledWith(
        MOCK_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved team member cards', () => {
      const articles = screen.getAllByRole('article');

      expect(articles).toHaveLength(MOCK_TEAM_MEMBERS.length);
    });
  });

  it.each(MOCK_SECTION_STYLE_OVERRIDE_CASES)(
    'scopes the section to $title',
    async ({ overrides }) => {
      getTeamModuleMock.mockResolvedValue(okResult(mockTeamModule(overrides)));

      await setup();

      expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
        overrides,
      );
    },
  );

  it('logs and renders nothing when the fetch fails', async () => {
    getTeamModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      TEAM_LOG.MODULE_FETCH_FAILED,
      { id: MOCK_MODULE_ID, error: MOCK_ERROR },
    );
  });
});
