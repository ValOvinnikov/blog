import { CONSENT_CATEGORY } from '@blog/config';
import { act, renderHook } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';

import { useConsent } from './consent-provider';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

describe(useConsent, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('reads a missing cookie as unanswered', () => {
    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    expect(result.current.status).toBe('unanswered');
  });

  it('reads a cookie of another version as unanswered', () => {
    document.cookie = 'consent=0.EXTERNAL_MEDIA; Path=/';

    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    expect(result.current.status).toBe('unanswered');
  });

  it('reads a declined cookie as denied', () => {
    document.cookie = 'consent=1.; Path=/';

    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    expect(result.current.status).toBe('denied');
  });

  it('updates the status without a reload once the category is granted', () => {
    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    act(() => result.current.grant());

    expect(result.current.status).toBe('granted');
    expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
  });

  it('always reports the necessary category as granted once answered', () => {
    document.cookie = 'consent=1.; Path=/';

    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.NECESSARY),
      { wrapper: AppProviders },
    );

    expect(result.current.status).toBe('granted');
  });
});
