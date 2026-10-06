import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeStatsModule } from '@web/testing/modules/stats/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(StatsModule, {
  id: 'stats-1',
});

describe(`<${StatsModule.name}/>`, () => {
  beforeEach(() => {
    getStatsModuleMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls getStatsModule with the module id and the tenant Sanity context', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getStatsModuleMock.mockResolvedValue({ ok: true, data: makeStatsModule() });

    await setup();

    expect(getStatsModuleMock).toHaveBeenCalledWith('stats-1', tenant);
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
