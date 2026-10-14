import { CONSENT_CATEGORY } from '@blog/config';
import { CONSENT_STATUS } from '@web/constants/consent';
import { act, renderHook } from '@web/testing/custom-render';

import { useConsent } from './use-consent';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

describe(useConsent, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  describe('with no stored answer', () => {
    let result: ReturnType<
      typeof renderHook<ReturnType<typeof useConsent>, unknown>
    >['result'];

    beforeEach(() => {
      ({ result } = renderHook(() =>
        useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      ));
    });

    it('reads a missing cookie as unanswered', () => {
      expect(result.current.status).toBe(CONSENT_STATUS.UNANSWERED);
    });

    it('updates the status without a reload once the category is granted', () => {
      act(() => result.current.grant());

      expect(result.current.status).toBe(CONSENT_STATUS.GRANTED);
      expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
    });
  });

  describe('with a declined answer stored', () => {
    beforeEach(() => {
      document.cookie = 'consent=1.; Path=/';
    });

    it('reads a declined cookie as denied', () => {
      const { result } = renderHook(() =>
        useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      );

      expect(result.current.status).toBe(CONSENT_STATUS.DENIED);
    });

    it('always reports the necessary category as granted once answered', () => {
      const { result } = renderHook(() =>
        useConsent(CONSENT_CATEGORY.NECESSARY),
      );

      expect(result.current.status).toBe(CONSENT_STATUS.GRANTED);
    });
  });
});
