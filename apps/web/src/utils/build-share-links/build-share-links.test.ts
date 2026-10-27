import { SOCIAL_PLATFORMS } from '@blog/config';
import { faker } from '@faker-js/faker';

import { buildShareLinks } from './build-share-links';

faker.seed(106);

const MOCK_URL = faker.internet.url();
const [MOCK_FIRST_WORD, MOCK_SECOND_WORD] = faker.helpers.uniqueArray(
  faker.lorem.word,
  2,
);
const MOCK_TITLE = `${MOCK_FIRST_WORD} ${MOCK_SECOND_WORD}`;
const MOCK_SPECIAL_TITLE = `${MOCK_FIRST_WORD} & ${MOCK_SECOND_WORD}`;

const findLink = (
  links: ReturnType<typeof buildShareLinks>,
  platform: string,
) => links.find((link) => link.platform === platform);

describe(buildShareLinks, () => {
  it('builds an X intent url with the title and url encoded', () => {
    const links = buildShareLinks({ url: MOCK_URL, title: MOCK_TITLE });
    const xLink = findLink(links, SOCIAL_PLATFORMS.X);

    expect(xLink?.href).toBe(
      `https://twitter.com/intent/tweet?text=${MOCK_FIRST_WORD}+${MOCK_SECOND_WORD}&url=${encodeURIComponent(MOCK_URL)}`,
    );
  });

  it('encodes special characters in the title', () => {
    const links = buildShareLinks({ url: MOCK_URL, title: MOCK_SPECIAL_TITLE });
    const xLink = findLink(links, SOCIAL_PLATFORMS.X);

    expect(xLink?.href).toBe(
      `https://twitter.com/intent/tweet?text=${MOCK_FIRST_WORD}+%26+${MOCK_SECOND_WORD}&url=${encodeURIComponent(MOCK_URL)}`,
    );
  });

  it('builds a LinkedIn share-offsite url with the url encoded', () => {
    const links = buildShareLinks({ url: MOCK_URL, title: MOCK_TITLE });
    const linkedInLink = findLink(links, SOCIAL_PLATFORMS.LINKEDIN);

    expect(linkedInLink?.href).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(MOCK_URL)}`,
    );
  });

  it('returns exactly the X and LinkedIn links, in that order', () => {
    const links = buildShareLinks({ url: MOCK_URL, title: MOCK_TITLE });

    expect(links.map((link) => link.platform)).toEqual([
      SOCIAL_PLATFORMS.X,
      SOCIAL_PLATFORMS.LINKEDIN,
    ]);
  });

  it('leaves icons for the web layer to attach', () => {
    const links = buildShareLinks({ url: MOCK_URL, title: MOCK_TITLE });

    expect(links.map((link) => link.icon)).toEqual([undefined, undefined]);
  });
});
