import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { isWebAnalyticsEnabled } from '@web/utils/is-web-analytics-enabled';
import type { ReactElement } from 'react';

import { SiteAnalytics } from './site-analytics';

vi.mock('@web/server/settings-features/is-capability-enabled/is-capability-enabled', () => ({
  isCapabilityEnabled: vi.fn(),
}));

vi.mock('@web/utils/is-web-analytics-enabled', () => ({
  isWebAnalyticsEnabled: vi.fn(),
}));

const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);
const isWebAnalyticsEnabledMock = vi.mocked(isWebAnalyticsEnabled);

const typesOf = (node: ReactElement | null): unknown[] =>
  node === null
    ? []
    : [
        (node.props as { children: ReactElement[] }).children.map(
          (child) => child.type,
        ),
      ].flat();

const setup = async () =>
  (await SiteAnalytics()) as ReactElement<{ children: ReactElement[] }> | null;

describe(SiteAnalytics, () => {
  beforeEach(() => {
    isWebAnalyticsEnabledMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(true);
  });

  it('mounts Analytics and SpeedInsights when enabled and the capability is entitled', async () => {
    expect(typesOf(await setup())).toEqual([SpeedInsights, Analytics]);
  });

  it('renders nothing when web analytics is not enabled', async () => {
    isWebAnalyticsEnabledMock.mockReturnValue(false);

    expect(await setup()).toBeNull();
  });

  it('renders nothing when the ANALYTICS capability is not entitled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);

    expect(await setup()).toBeNull();
    expect(isCapabilityEnabledMock).toHaveBeenCalledWith('ANALYTICS');
  });
});
