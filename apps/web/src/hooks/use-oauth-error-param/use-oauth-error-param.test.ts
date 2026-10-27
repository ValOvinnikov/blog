/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import { renderHook, waitFor } from '@web/testing/custom-render';

import { useOAuthErrorParam } from './use-oauth-error-param';

faker.seed(6012);

const MOCK_ERROR_CODE = faker.string.alpha(12);
const MOCK_OTHER_PARAM = `${faker.string.alpha(5)}=${faker.string.alpha(5)}`;

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
    setLocation(`?error=${MOCK_ERROR_CODE}`);

    const { result } = renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(result.current).toBe(MOCK_ERROR_CODE);
    });
  });

  it('strips the error param from the URL bar once read', async () => {
    setLocation(`?error=${MOCK_ERROR_CODE}`);

    renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });

  it('preserves other query params when stripping the error param', async () => {
    setLocation(`?${MOCK_OTHER_PARAM}&error=${MOCK_ERROR_CODE}`);

    renderHook(() => useOAuthErrorParam());

    await waitFor(() => {
      expect(window.location.search).toBe(`?${MOCK_OTHER_PARAM}`);
    });
  });
});
