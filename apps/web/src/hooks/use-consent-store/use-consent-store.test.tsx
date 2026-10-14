import { CONSENT_CATEGORY } from '@blog/config';
import { act, renderHook } from '@web/testing/custom-render';
import { renderToString } from 'react-dom/server';

import { useConsentStore } from './use-consent-store';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

describe(useConsentStore, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('reads as unknown on the server', () => {
    const Probe = () => <p>{useConsentStore().status}</p>;

    expect(renderToString(<Probe />)).toContain('unknown');
  });

  it.each([
    ['a missing cookie', undefined],
    ['a cookie of another version', 'consent=0.EXTERNAL_MEDIA; Path=/'],
    ['a malformed cookie', 'consent=EXTERNAL_MEDIA; Path=/'],
  ])('reads %s as unanswered', (_label, cookie) => {
    if (cookie) document.cookie = cookie;

    const { result } = renderHook(() => useConsentStore());

    expect(result.current.status).toBe('unanswered');
    expect(result.current.granted).toEqual([]);
  });

  it('reads a cookie written before the refactor', () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';

    const { result } = renderHook(() => useConsentStore());

    expect(result.current.status).toBe('answered');
    expect(result.current.granted).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
  });

  it('returns the same answer between renders while the cookie is unchanged', () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
    const { result, rerender } = renderHook(() => useConsentStore());
    const { granted } = result.current;

    rerender();

    expect(result.current.granted).toBe(granted);
  });

  describe('with no stored answer', () => {
    let result: ReturnType<
      typeof renderHook<ReturnType<typeof useConsentStore>, unknown>
    >['result'];

    beforeEach(() => {
      ({ result } = renderHook(() => useConsentStore()));
    });

    it('grants every optional category on accept all', () => {
      act(() => result.current.acceptAll());

      expect(result.current.status).toBe('answered');
      expect(result.current.granted).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    });

    it('persists exactly the categories passed to save', () => {
      act(() => result.current.save([CONSENT_CATEGORY.EXTERNAL_MEDIA]));

      expect(result.current.granted).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
      expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
    });
  });

  it('grants nothing on reject all but still counts as answered', () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
    const { result } = renderHook(() => useConsentStore());

    act(() => result.current.rejectAll());

    expect(result.current.status).toBe('answered');
    expect(result.current.granted).toEqual([]);
  });

  it('updates every mounted tree when consent is written', () => {
    const first = renderHook(() => useConsentStore());
    const second = renderHook(() => useConsentStore());

    act(() => first.result.current.acceptAll());

    expect(second.result.current.status).toBe('answered');
  });
});
