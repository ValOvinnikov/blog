import { CONSENT_CATEGORY } from '@blog/config';
import { CONSENT_STATUS } from '@web/constants/consent';
import { act, renderHook } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  MOCK_ANSWERED_CONSENT_PAIR,
  MOCK_DECLINED_CONSENT_COOKIE,
} from '@web/testing/hooks/use-consent-store/fixtures';

import { useConsent } from './use-consent';

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
      expect(document.cookie).toContain(MOCK_ANSWERED_CONSENT_PAIR);
    });
  });

  describe('with a declined answer stored', () => {
    beforeEach(() => {
      document.cookie = MOCK_DECLINED_CONSENT_COOKIE;
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
