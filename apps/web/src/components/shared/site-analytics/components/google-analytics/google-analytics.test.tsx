import { CONSENT_CATEGORY } from '@shinefold/config';
import { MOCK_GOOGLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import { GOOGLE_TAG_MANAGER_ORIGIN } from '@web/config/analytics-origins';
import { useConsentStore } from '@web/hooks/use-consent-store';
import {
  act,
  customRender,
  renderHook,
  screen,
} from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';
import { SCRIPT_TEST_ID } from '@web/testing/shared/next-script/mock-next-script';

import { GoogleAnalytics } from './google-analytics';

vi.mock(
  'next/script',
  () => import('@web/testing/shared/next-script/mock-next-script'),
);

const { analyticsId: MOCK_MEASUREMENT_ID } = MOCK_GOOGLE_ANALYTICS;
const OPT_OUT_KEY = `ga-disable-${MOCK_MEASUREMENT_ID}`;

const setup = customRender(GoogleAnalytics, {
  measurementId: MOCK_MEASUREMENT_ID,
});

const isOptedOut = () => Reflect.get(window, OPT_OUT_KEY);

describe(GoogleAnalytics, () => {
  afterEach(() => {
    clearConsentCookie();
    Reflect.deleteProperty(window, OPT_OUT_KEY);
  });

  it('loads nothing from Google before the visitor answers', () => {
    clearConsentCookie();

    setup();

    const script = screen.queryByTestId(SCRIPT_TEST_ID);
    expect(script).not.toBeInTheDocument();
    expect(isOptedOut()).toBe(true);
  });

  it('loads nothing from Google when only external media is allowed', () => {
    grantConsent([CONSENT_CATEGORY.EXTERNAL_MEDIA]);

    setup();

    const script = screen.queryByTestId(SCRIPT_TEST_ID);
    expect(script).not.toBeInTheDocument();
  });

  describe('once analytics is allowed', () => {
    beforeEach(() => {
      grantConsent([CONSENT_CATEGORY.ANALYTICS]);
      setup();
    });

    it('loads gtag for the measurement id', () => {
      const [loader, config] = screen.getAllByTestId(SCRIPT_TEST_ID);
      expect(loader).toHaveTextContent(
        `${GOOGLE_TAG_MANAGER_ORIGIN}/gtag/js?id=${MOCK_MEASUREMENT_ID}`,
      );
      expect(config).toHaveTextContent(MOCK_MEASUREMENT_ID);
      expect(isOptedOut()).toBe(false);
    });

    it('opts out of Google Analytics when the visitor withdraws it', () => {
      const { result } = renderHook(() => useConsentStore());

      act(() => {
        result.current.save([]);
      });

      const script = screen.queryByTestId(SCRIPT_TEST_ID);
      expect(script).not.toBeInTheDocument();
      expect(isOptedOut()).toBe(true);
    });
  });
});
