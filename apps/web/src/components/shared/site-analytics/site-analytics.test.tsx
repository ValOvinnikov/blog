import { CAPABILITY } from '@blog/config';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { SiteAnalytics } from './site-analytics';

const { mockEnv, ANALYTICS_TEXT, SPEED_INSIGHTS_TEXT } = vi.hoisted(() => ({
  mockEnv: { WEB_ANALYTICS_ENABLED: 'true' },
  ANALYTICS_TEXT: 'Vercel Analytics',
  SPEED_INSIGHTS_TEXT: 'Vercel Speed Insights',
}));

vi.mock('@web/utils/env/env', () => ({ env: mockEnv }));

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: vi.fn() }),
);

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <p>{ANALYTICS_TEXT}</p>,
}));

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <p>{SPEED_INSIGHTS_TEXT}</p>,
}));

const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

const setup = customRenderAsync(SiteAnalytics, {});

describe(SiteAnalytics, () => {
  beforeEach(() => {
    mockEnv.WEB_ANALYTICS_ENABLED = 'true';
    isCapabilityEnabledMock.mockResolvedValue(true);
  });

  it('mounts Analytics and SpeedInsights when enabled and entitled', async () => {
    await setup();

    const analytics = screen.getByText(ANALYTICS_TEXT);
    const speedInsights = screen.getByText(SPEED_INSIGHTS_TEXT);

    expect(analytics).toBeVisible();
    expect(speedInsights).toBeVisible();
  });

  it('renders nothing when web analytics is not enabled', async () => {
    mockEnv.WEB_ANALYTICS_ENABLED = 'false';

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the ANALYTICS capability is not entitled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(isCapabilityEnabledMock).toHaveBeenCalledWith(CAPABILITY.ANALYTICS);
  });
});
