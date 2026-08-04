import { renderHook, waitFor } from '@web/testing/custom-render';

import { useOAuthErrorParam } from './use-oauth-error-param';

const setLocation = (search: string) => {
  window.history.replaceState(null, '', `/${search}`);
};

describe(useOAuthErrorParam, () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('returns null when there is no error param', () => {
    setLocation('');

    const { result } = renderHook(() => useOAuthErrorParam());

    expect(result.current).toBeNull();
  });

  it('returns the error param value on mount', async () => {
    setLocation('?error=OAuthAccountNotLinked');

    const { result } = renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(result.current).toBe('OAuthAccountNotLinked');
    });
  });

  it('strips the error param from the URL bar once read', async () => {
    setLocation('?error=Configuration');

    renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });

  it('preserves other query params when stripping the error param', async () => {
    setLocation('?foo=bar&error=Configuration');

    renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(window.location.search).toBe('?foo=bar');
    });
  });
});
