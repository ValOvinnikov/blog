const RELATIVE_BASE = 'http://relative.invalid';

export const withSearchParam = (
  href: string,
  name: string,
  value: string,
): string => {
  const url = new URL(href, RELATIVE_BASE);
  url.searchParams.set(name, value);
  return url.origin === RELATIVE_BASE
    ? `${url.pathname}${url.search}${url.hash}`
    : url.toString();
};
