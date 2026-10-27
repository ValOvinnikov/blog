import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_STAT_ITEMS,
  mockStatsModule,
} from '@web/testing/modules/stats/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { StatsModule } from './stats-module';

const { getStatsModuleMock } = vi.hoisted(() => ({
  getStatsModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      stats: { v1: { getStatsModule: getStatsModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(32);

const MOCK_MODULE_ID = faker.string.uuid();

const setup = customRenderAsync(StatsModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${StatsModule.name}/>`, () => {
  beforeEach(() => {
    getStatsModuleMock.mockReset();
    getStatsModuleMock.mockResolvedValue(okResult(mockStatsModule()));
  });

  it('fetches the module with the tenant Sanity context', async () => {
    await setup();

    expect(getStatsModuleMock).toHaveBeenCalledWith(
      MOCK_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getStatsModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it.each(MOCK_STAT_ITEMS.map(({ label }) => label))(
    'renders the resolved stat labelled %s',
    async (label) => {
      await setup();

      const statLabel = screen.getByText(label);

      expect(statLabel).toBeVisible();
    },
  );
});
