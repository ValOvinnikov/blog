import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toDraftPreviewPath } from './to-draft-preview-path';

faker.seed(7182);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_HREF = `/${faker.lorem.slug()}/${faker.lorem.slug()}`;
const MOCK_UNENCODED_SEGMENT = 'café über';
const MOCK_ENCODED_SEGMENT = 'caf%C3%A9%20%C3%BCber';
const MOCK_RESERVED_SEGMENT = 'a:b@c,d+e=f&g;h$i';
const MOCK_ENCODED_RESERVED_SEGMENT = 'a%3Ab%40c%2Cd%2Be%3Df%26g%3Bh%24i';

describe(toDraftPreviewPath, () => {
  it("leaves a page in the tenant's default language unprefixed", () => {
    expect(toDraftPreviewPath({ href: MOCK_HREF, locale: EN }, EN)).toBe(
      MOCK_HREF,
    );
  });

  it("prefixes a page in another language with that language's tag", () => {
    expect(toDraftPreviewPath({ href: MOCK_HREF, locale: NL }, EN)).toBe(
      `/${LOCALE_BCP47_TAGS[NL]}${MOCK_HREF}`,
    );
  });

  it('percent-encodes each segment the way the request path carries it', () => {
    expect(
      toDraftPreviewPath(
        { href: `/blog/${MOCK_UNENCODED_SEGMENT}`, locale: EN },
        EN,
      ),
    ).toBe(`/blog/${MOCK_ENCODED_SEGMENT}`);
  });

  it('percent-encodes reserved characters a browser would leave raw', () => {
    expect(
      toDraftPreviewPath(
        { href: `/blog/${MOCK_RESERVED_SEGMENT}`, locale: EN },
        EN,
      ),
    ).toBe(`/blog/${MOCK_ENCODED_RESERVED_SEGMENT}`);
  });
});
