import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeStatsModule } from '@web/testing/modules/stats/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

vi.mock('@web/server/tenant/get-tenant-sanity-context');

const getTenantSanityContextMock = vi.mocked(getTenantSanityContext);

const setup = customRenderAsync(StatsModule, {
  id: 'stats-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${StatsModule.name}/>`, () => {
  beforeEach(() => {
    getStatsModuleMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getStatsModule with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getStatsModuleMock.mockResolvedValue({ ok: true, data: makeStatsModule() });

    await setup();

    expect(getStatsModuleMock).toHaveBeenCalledWith('stats-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1', 'en');
  });

  it('renders nothing when the fetch fails', async () => {
    getStatsModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved stat figures', async () => {
    getStatsModuleMock.mockResolvedValue({
      ok: true,
      data: makeStatsModule({
        stats: [
          {
            id: 'stat-1',
            value: '2.4M',
            label: 'Monthly readers',
            description: undefined,
          },
          {
            id: 'stat-2',
            value: '<50ms',
            label: 'Median TTFB',
            description: undefined,
          },
        ],
      }),
    });

    await setup();

    expect(screen.getByText('Monthly readers')).toBeVisible();
    expect(screen.getByText('Median TTFB')).toBeVisible();
  });
});
