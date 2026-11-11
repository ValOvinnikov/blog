import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toDraftPreviewPath } from './to-draft-preview-path';

faker.seed(7182);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_HREF = `/${faker.lorem.slug()}/${faker.lorem.slug()}`;
const MOCK_UNENCODED_SEGMENT = 'café über';
const MOCK_ENCODED_SEGMENT = 'caf%C3%A9%20%C3%BCber';

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
});
