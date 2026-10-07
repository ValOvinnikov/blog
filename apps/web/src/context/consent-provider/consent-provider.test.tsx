import { CONSENT_CATEGORY } from '@blog/config';
import { act, renderHook } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { renderToString } from 'react-dom/server';

import {
  ConsentProvider,
  useConsent,
  useConsentChoices,
  useConsentPreferences,
} from './consent-provider';

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
      ({ result } = renderHook(
        () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
        { wrapper: AppProviders },
      ));
    });

    it('reads a missing cookie as unanswered', () => {
      expect(result.current.status).toBe('unanswered');
    });

    it('updates the status without a reload once the category is granted', () => {
      act(() => result.current.grant());

      expect(result.current.status).toBe('granted');
      expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
    });
  });

  it('reads a cookie of another version as unanswered', () => {
    document.cookie = 'consent=0.EXTERNAL_MEDIA; Path=/';

    const { result } = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    expect(result.current.status).toBe('unanswered');
  });

  describe('with a declined answer stored', () => {
    beforeEach(() => {
      document.cookie = 'consent=1.; Path=/';
    });

    it('reads a declined cookie as denied', () => {
      const { result } = renderHook(
        () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
        { wrapper: AppProviders },
      );

      expect(result.current.status).toBe('denied');
    });

    it('always reports the necessary category as granted once answered', () => {
      const { result } = renderHook(
        () => useConsent(CONSENT_CATEGORY.NECESSARY),
        { wrapper: AppProviders },
      );

      expect(result.current.status).toBe('granted');
    });
  });
});

describe(ConsentProvider, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('renders consent as unknown on the server', () => {
    const Probe = () => (
      <p>{useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA).status}</p>
    );

    expect(
      renderToString(
        <AppProviders>
          <Probe />
        </AppProviders>,
      ),
    ).toContain('unknown');
  });

  it('updates every mounted tree when consent is written', () => {
    const first = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );
    const second = renderHook(
      () => useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA),
      { wrapper: AppProviders },
    );

    act(() => first.result.current.grant());

    expect(second.result.current.status).toBe('granted');
  });
});

describe(useConsentChoices, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('grants nothing on reject all but still counts as answered', () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
    const { result } = renderHook(() => useConsentChoices(), {
      wrapper: AppProviders,
    });

    act(() => result.current.rejectAll());

    expect(result.current.status).toBe('answered');
    expect(result.current.granted).toEqual([]);
  });

  describe('with no stored answer', () => {
    let result: ReturnType<
      typeof renderHook<ReturnType<typeof useConsentChoices>, unknown>
    >['result'];

    beforeEach(() => {
      ({ result } = renderHook(() => useConsentChoices(), {
        wrapper: AppProviders,
      }));
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
});

describe(useConsentPreferences, () => {
  it('opens and closes the preferences', () => {
    const { result } = renderHook(() => useConsentPreferences(), {
      wrapper: AppProviders,
    });

    act(() => result.current.openPreferences());
    expect(result.current.isPreferencesOpen).toBe(true);

    act(() => result.current.closePreferences());
    expect(result.current.isPreferencesOpen).toBe(false);
  });
});
