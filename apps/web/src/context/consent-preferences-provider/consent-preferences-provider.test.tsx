import { act, renderHook } from '@web/testing/custom-render';

import {
  ConsentPreferencesProvider,
  useConsentPreferences,
} from './consent-preferences-provider';

describe(useConsentPreferences, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens and closes the preferences', () => {
    const { result } = renderHook(() => useConsentPreferences(), {
      wrapper: ConsentPreferencesProvider,
    });

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('fails loudly outside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useConsentPreferences())).toThrow(
      'useConsentPreferences must be used within a ConsentPreferencesProvider',
    );
  });
});
