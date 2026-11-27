import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import { PLAUSIBLE_ORIGIN } from '@web/config/analytics-origins';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteAnalytics } from '@web/server/site-config/get-site-analytics/get-site-analytics';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { SCRIPT_TEST_ID } from '@web/testing/shared/next-script/mock-next-script';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { SiteAnalytics } from './site-analytics';

const { mockEnv, ANALYTICS_TEXT, SPEED_INSIGHTS_TEXT, GOOGLE_ANALYTICS_TEXT } =
  vi.hoisted(() => ({
    mockEnv: { WEB_ANALYTICS_ENABLED: 'true' },
    ANALYTICS_TEXT: 'Vercel Analytics',
    SPEED_INSIGHTS_TEXT: 'Vercel Speed Insights',
    GOOGLE_ANALYTICS_TEXT: 'Google Analytics',
  }));

vi.mock('@web/utils/env/env', () => ({ env: mockEnv }));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-site-analytics/get-site-analytics');

vi.mock(
  'next/script',
  () => import('@web/testing/shared/next-script/mock-next-script'),
);

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <p>{ANALYTICS_TEXT}</p>,
}));

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <p>{SPEED_INSIGHTS_TEXT}</p>,
}));

vi.mock('./components/google-analytics/google-analytics', () => ({
  GoogleAnalytics: ({ measurementId }: { measurementId: string }) => (
    <p>{`${GOOGLE_ANALYTICS_TEXT} ${measurementId}`}</p>
  ),
}));

const getSiteAnalyticsMock = vi.mocked(getSiteAnalytics);

const setup = customRenderAsync(SiteAnalytics, {});

describe(SiteAnalytics, () => {
  beforeEach(() => {
    mockEnv.WEB_ANALYTICS_ENABLED = 'true';
  });

  describe('with Vercel analytics on and no analytics tool', () => {
    beforeEach(async () => {
      await setup();
    });

    it('mounts Vercel Analytics and Speed Insights', () => {
      const analytics = screen.getByText(ANALYTICS_TEXT);
      const speedInsights = screen.getByText(SPEED_INSIGHTS_TEXT);

      expect(analytics).toBeVisible();
      expect(speedInsights).toBeVisible();
    });

    it("reads the request tenant's analytics tool", () => {
      expect(getSiteAnalyticsMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });
  });

  it('renders nothing with Vercel analytics off and no analytics tool', async () => {
    mockEnv.WEB_ANALYTICS_ENABLED = 'false';

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on a draft preview render', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      isDraftPreview: true,
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it("loads Plausible for the site's domain", async () => {
    getSiteAnalyticsMock.mockResolvedValueOnce(MOCK_PLAUSIBLE_ANALYTICS);

    await setup();

    const script = screen.getByTestId(SCRIPT_TEST_ID);
    expect(script).toHaveTextContent(PLAUSIBLE_ORIGIN);
    expect(script).toHaveAttribute(
      'data-domain',
      MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
    );
  });

  it('hands Google Analytics its measurement id and loads nothing itself', async () => {
    getSiteAnalyticsMock.mockResolvedValueOnce(MOCK_GOOGLE_ANALYTICS);

    await setup();

    const googleAnalytics = screen.getByText(
      `${GOOGLE_ANALYTICS_TEXT} ${MOCK_GOOGLE_ANALYTICS.analyticsId}`,
    );
    const script = screen.queryByTestId(SCRIPT_TEST_ID);
    expect(googleAnalytics).toBeVisible();
    expect(script).not.toBeInTheDocument();
  });
});
