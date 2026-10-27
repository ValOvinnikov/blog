import { faker } from '@faker-js/faker';

import { sanitizeHref } from './sanitize-href';

faker.seed(6029);

const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_TRUSTED_DOMAIN = faker.internet.domainName();
const MOCK_PATH = faker.lorem.slug();
const MOCK_USERNAME = faker.internet.username().toLowerCase();
const MOCK_PASSWORD = faker.internet.password();
const MOCK_MAILTO = `mailto:${MOCK_USERNAME}@${MOCK_DOMAIN}`;

describe(sanitizeHref, () => {
  it.each([
    ['an http url', `http://${MOCK_DOMAIN}/${MOCK_PATH}`],
    ['an https url with a query', `https://${MOCK_DOMAIN}/${MOCK_PATH}?y=1`],
    ['a mailto url', MOCK_MAILTO],
  ])('allows %s through unchanged', (_label, href) => {
    expect(sanitizeHref(href)).toBe(href);
  });

  it.each([
    ['a javascript: url', 'javascript:alert(document.cookie)'],
    ['a javascript: url disguised with case', 'JavaScript:alert(1)'],
    ['a javascript: url with a tab in the scheme', 'java\tscript:alert(1)'],
    ['a javascript: url with a newline in the scheme', 'java\nscript:alert(1)'],
    ['a javascript: url with leading whitespace', '   javascript:alert(1)'],
    [
      'a javascript: url with a leading control character',
      '\u0001javascript:alert(1)',
    ],
    ['a data: url', 'data:text/html,<script>alert(1)</script>'],
    ['a vbscript: url', 'vbscript:msgbox(1)'],
    ['a scheme-relative url', `//${MOCK_DOMAIN}/${MOCK_PATH}`],
    ['an unparseable value', 'not a url at all'],
    ['an empty value', ''],
    ['a percent-encoded javascript scheme', 'javascript%3Aalert(1)'],
    ['an entity-encoded scheme', '&#106;avascript:alert(1)'],
    [
      'an http url carrying userinfo',
      `http://${MOCK_USERNAME}@${MOCK_DOMAIN}/`,
    ],
    [
      'an https url carrying userinfo with a password',
      `https://${MOCK_USERNAME}:${MOCK_PASSWORD}@${MOCK_DOMAIN}/`,
    ],
    [
      'an https url whose userinfo looks like a trusted domain',
      `https://${MOCK_TRUSTED_DOMAIN}@${MOCK_DOMAIN}/`,
    ],
  ])('rejects %s', (_label, href) => {
    expect(sanitizeHref(href)).toBeNull();
  });

  it.each([
    [
      'percent-encoded CR/LF header injection',
      `${MOCK_MAILTO}?subject=x%0d%0aBcc:${MOCK_USERNAME}@${MOCK_TRUSTED_DOMAIN}`,
    ],
    ['a benign subject', `${MOCK_MAILTO}?subject=hello`],
  ])('strips a mailto query string holding %s', (_label, href) => {
    expect(sanitizeHref(href)).toBe(MOCK_MAILTO);
  });
});
