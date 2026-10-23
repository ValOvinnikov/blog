import { errorResult, okResult } from '@blog/utils';
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

const setup = customRenderAsync(StatsModule, {
  id: 'stats-1',
});

describe(`<${StatsModule.name}/>`, () => {
  beforeEach(() => {
    getStatsModuleMock.mockReset();
    getStatsModuleMock.mockResolvedValue(okResult(mockStatsModule()));
  });

  it('fetches the module with the tenant Sanity context', async () => {
    await setup();

    expect(getStatsModuleMock).toHaveBeenCalledWith(
      'stats-1',
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getStatsModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved stat figures', async () => {
    await setup();

    MOCK_STAT_ITEMS.forEach(({ label }) => {
      const statLabel = screen.getByText(label);
      expect(statLabel).toBeVisible();
    });
  });
});
