export const REQUESTED_PATH_HEADER = 'x-admin-requested-path';

// A client navigation's `_rsc` cache-buster must not survive into the URL sign-in returns to.
export const toRequestedPath = (url: URL): string => {
  const searchParams = new URLSearchParams(url.searchParams);

  searchParams.delete('_rsc');

  const search = searchParams.toString();

  return search ? `${url.pathname}?${search}` : url.pathname;
};
