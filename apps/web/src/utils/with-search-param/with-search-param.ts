const HASH = '#';
const QUERY = '?';
const WEB_PROTOCOLS = ['http:', 'https:'];
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

const splitOnce = (value: string, separator: string): [string, string] => {
  const index = value.indexOf(separator);
  return index === -1
    ? [value, '']
    : [value.slice(0, index), value.slice(index + 1)];
};

const withRelativeSearchParam = (
  href: string,
  name: string,
  value: string,
): string => {
  const [beforeHash, hash] = splitOnce(href, HASH);
  const [path, query] = splitOnce(beforeHash, QUERY);
  const params = new URLSearchParams(query);
  params.set(name, value);
  return `${path}${QUERY}${params}${hash ? `${HASH}${hash}` : ''}`;
};

export const withSearchParam = (
  href: string,
  name: string,
  value: string,
): string => {
  if (href.startsWith(HASH)) return href;
  if (!SCHEME_PATTERN.test(href)) {
    return withRelativeSearchParam(href, name, value);
  }
  const url = new URL(href);
  if (!WEB_PROTOCOLS.includes(url.protocol)) return href;
  url.searchParams.set(name, value);
  return url.toString();
};
