import { LINK_TYPE } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { toLinkId, toLinkIdentityKey } from './link-identity';

faker.seed(12);

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_LABEL = faker.lorem.words();
const MOCK_OTHER_LABEL = faker.lorem.words();
const MOCK_URL = faker.internet.url();
const MOCK_OTHER_URL = faker.internet.url();
const MOCK_IDENTITY_KEY = faker.string.uuid();
const MOCK_OTHER_IDENTITY_KEY = faker.string.uuid();

const internalLink = (label: string) => ({
  linkType: LINK_TYPE.INTERNAL,
  label,
  internalReference: { _ref: MOCK_PAGE_ID },
});

const externalLink = (url: string, label?: string) => ({
  linkType: LINK_TYPE.EXTERNAL,
  url,
  label,
});

describe(toLinkIdentityKey, () => {
  it.each([
    [
      'an internal link on the referenced document id and label',
      internalLink(MOCK_LABEL),
      `internal:${MOCK_PAGE_ID}|label:${MOCK_LABEL}`,
    ],
    [
      'an external link on the url and label',
      externalLink(MOCK_URL, MOCK_LABEL),
      `external:${MOCK_URL}|label:${MOCK_LABEL}`,
    ],
    [
      'a link with no label as the empty label',
      externalLink(MOCK_URL),
      `external:${MOCK_URL}|label:`,
    ],
  ])('keys %s', (_label, link, expected) => {
    expect(toLinkIdentityKey(link)).toBe(expected);
  });

  it('keys a missing label the same as an empty one', () => {
    expect(toLinkIdentityKey(externalLink(MOCK_URL))).toBe(
      toLinkIdentityKey(externalLink(MOCK_URL, '')),
    );
  });

  it('keys links with the same label but different destinations differently', () => {
    expect(toLinkIdentityKey(externalLink(MOCK_URL, MOCK_LABEL))).not.toBe(
      toLinkIdentityKey(externalLink(MOCK_OTHER_URL, MOCK_LABEL)),
    );
  });

  it('keys links with the same destination but different labels differently', () => {
    expect(toLinkIdentityKey(internalLink(MOCK_LABEL))).not.toBe(
      toLinkIdentityKey(internalLink(MOCK_OTHER_LABEL)),
    );
  });

  it('keys links with the same destination and label the same', () => {
    expect(toLinkIdentityKey(internalLink(MOCK_LABEL))).toBe(
      toLinkIdentityKey(internalLink(MOCK_LABEL)),
    );
  });

  it.each([
    ['an internal link with no reference', { linkType: LINK_TYPE.INTERNAL }],
    ['an external link with no url', { linkType: LINK_TYPE.EXTERNAL }],
    ['a link with no link type', { url: MOCK_URL }],
  ])('has no key for %s', (_label, link) => {
    expect(toLinkIdentityKey(link)).toBeUndefined();
  });
});

describe(toLinkId, () => {
  it('derives the same id from the same identity key', () => {
    expect(toLinkId(MOCK_IDENTITY_KEY)).toBe(toLinkId(MOCK_IDENTITY_KEY));
  });

  it('derives different ids from different identity keys', () => {
    expect(toLinkId(MOCK_IDENTITY_KEY)).not.toBe(
      toLinkId(MOCK_OTHER_IDENTITY_KEY),
    );
  });

  it('prefixes the id and keeps it to id-safe characters', () => {
    expect(toLinkId(`external:${MOCK_URL}?b=c#d`)).toMatch(
      /^link-[a-f0-9]{16}$/,
    );
  });
});
