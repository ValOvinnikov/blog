import { CONSENT_CATEGORY } from '@shinefold/config';
import { CONSENT_STATUS } from '@web/constants/consent';
import { act, renderHook } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  MOCK_ANSWERED_CONSENT_COOKIE,
  MOCK_ANSWERED_CONSENT_PAIR,
  MOCK_MALFORMED_CONSENT_COOKIE,
  MOCK_OTHER_VERSION_CONSENT_COOKIE,
} from '@web/testing/hooks/use-consent-store/fixtures';
import { renderToString } from 'react-dom/server';

import { useConsentStore } from './use-consent-store';

describe(useConsentStore, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('reads as unknown on the server', () => {
    const Probe = () => <p>{useConsentStore().status}</p>;

    expect(renderToString(<Probe />)).toContain(CONSENT_STATUS.UNKNOWN);
  });

  it.each([
    ['a missing cookie', undefined],
    ['a cookie of another version', MOCK_OTHER_VERSION_CONSENT_COOKIE],
    ['a malformed cookie', MOCK_MALFORMED_CONSENT_COOKIE],
  ])('reads %s as unanswered', (_label, cookie) => {
    if (cookie) document.cookie = cookie;

    const { result } = renderHook(() => useConsentStore());

    expect(result.current.status).toBe(CONSENT_STATUS.UNANSWERED);
    expect(result.current.granted).toEqual([]);
  });

  describe('with a stored answer', () => {
    let result: ReturnType<
      typeof renderHook<ReturnType<typeof useConsentStore>, unknown>
    >['result'];
    let rerender: () => void;

    beforeEach(() => {
      document.cookie = MOCK_ANSWERED_CONSENT_COOKIE;
      ({ result, rerender } = renderHook(() => useConsentStore()));
    });

    it('reads it', () => {
      expect(result.current.status).toBe(CONSENT_STATUS.ANSWERED);
      expect(result.current.granted).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    });

    it('returns the same answer between renders while the cookie is unchanged', () => {
      const { granted } = result.current;

      rerender();

      expect(result.current.granted).toBe(granted);
    });

    it('grants nothing on reject all but still counts as answered', () => {
      act(() => result.current.rejectAll());

      expect(result.current.status).toBe(CONSENT_STATUS.ANSWERED);
      expect(result.current.granted).toEqual([]);
    });

    it('advances the save revision even when a save repeats the answer', () => {
      const { saveRevision } = result.current;

      let returnedRevision = saveRevision;
      act(() => {
        returnedRevision = result.current.save([
          CONSENT_CATEGORY.EXTERNAL_MEDIA,
        ]);
      });

      expect(result.current.saveRevision).not.toBe(saveRevision);
      expect(result.current.saveRevision).toBe(returnedRevision);
    });
  });

  describe('with no stored answer', () => {
    let result: ReturnType<
      typeof renderHook<ReturnType<typeof useConsentStore>, unknown>
    >['result'];

    beforeEach(() => {
      ({ result } = renderHook(() => useConsentStore()));
    });

    it('persists exactly the categories passed to save', () => {
      act(() => result.current.save([CONSENT_CATEGORY.EXTERNAL_MEDIA]));

      expect(result.current.status).toBe(CONSENT_STATUS.ANSWERED);
      expect(result.current.granted).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
      expect(document.cookie).toContain(MOCK_ANSWERED_CONSENT_PAIR);
    });
  });

  it('updates every mounted tree when consent is written', () => {
    const first = renderHook(() => useConsentStore());
    const second = renderHook(() => useConsentStore());

    act(() => first.result.current.save([CONSENT_CATEGORY.EXTERNAL_MEDIA]));

    expect(second.result.current.status).toBe(CONSENT_STATUS.ANSWERED);
  });
});
