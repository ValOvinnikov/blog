const PERSISTENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const setPersistentCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${value}; max-age=${PERSISTENT_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};
