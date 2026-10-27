/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import { parseRssFeed } from '@web/testing/shared/rss/parse-rss-feed';

import {
  buildRssFeed,
  type TRssChannel,
  type TRssItem,
} from './build-rss-feed';

faker.seed(105);

const MOCK_REF_DATE = '2026-06-01T00:00:00Z';
const MOCK_OLDEST_PUBLISHED_AT = faker.date
  .past({ refDate: MOCK_REF_DATE })
  .toISOString();
const MOCK_ITEM_PUBLISHED_AT = faker.date
  .soon({ refDate: MOCK_OLDEST_PUBLISHED_AT })
  .toISOString();
const MOCK_NEWEST_PUBLISHED_AT = faker.date
  .soon({ refDate: MOCK_ITEM_PUBLISHED_AT, days: 30 })
  .toISOString();
const MOCK_FEED_URL = faker.internet.url();

const MOCK_CHANNEL: TRssChannel = {
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  link: faker.internet.url(),
  language: faker.location.language().alpha2,
  feedUrl: MOCK_FEED_URL,
};

const MOCK_ITEM: TRssItem = {
  title: faker.lorem.words(3),
  link: faker.internet.url(),
  description: faker.lorem.sentence(),
  publishedAt: MOCK_ITEM_PUBLISHED_AT,
};

const [MOCK_FIRST_WORD, MOCK_SECOND_WORD] = faker.helpers.uniqueArray(
  faker.lorem.word,
  2,
);
const MOCK_UNSAFE_TITLE = `${MOCK_FIRST_WORD} & ${MOCK_SECOND_WORD} <script>`;

describe(buildRssFeed, () => {
  it('writes the channel metadata', () => {
    const { channel } = parseRssFeed(buildRssFeed(MOCK_CHANNEL, [MOCK_ITEM]));

    expect(channel.title).toBe(MOCK_CHANNEL.title);
    expect(channel.link).toBe(MOCK_CHANNEL.link);
    expect(channel.description).toBe(MOCK_CHANNEL.description);
    expect(channel.language).toBe(MOCK_CHANNEL.language);
  });

  it('links the channel to its own feed URL', () => {
    const { selfLink } = parseRssFeed(buildRssFeed(MOCK_CHANNEL, [MOCK_ITEM]));

    expect(selfLink).toEqual({
      href: MOCK_FEED_URL,
      rel: 'self',
      type: 'application/rss+xml',
    });
  });

  it("dates the build to the newest item's publication", () => {
    const { channel } = parseRssFeed(
      buildRssFeed(MOCK_CHANNEL, [
        MOCK_ITEM,
        { ...MOCK_ITEM, publishedAt: MOCK_NEWEST_PUBLISHED_AT },
        { ...MOCK_ITEM, publishedAt: MOCK_OLDEST_PUBLISHED_AT },
      ]),
    );

    expect(channel.lastBuildDate).toBe(
      new Date(MOCK_NEWEST_PUBLISHED_AT).toUTCString(),
    );
  });

  it('renders each item with title, link, description and pubDate', () => {
    const { items } = parseRssFeed(buildRssFeed(MOCK_CHANNEL, [MOCK_ITEM]));

    expect(items).toEqual([
      {
        title: MOCK_ITEM.title,
        link: MOCK_ITEM.link,
        guid: MOCK_ITEM.link,
        description: MOCK_ITEM.description,
        pubDate: new Date(MOCK_ITEM_PUBLISHED_AT).toUTCString(),
      },
    ]);
  });

  it('keeps XML-reserved characters in item titles intact and well-formed', () => {
    const { isWellFormed, items } = parseRssFeed(
      buildRssFeed(MOCK_CHANNEL, [{ ...MOCK_ITEM, title: MOCK_UNSAFE_TITLE }]),
    );

    expect(isWellFormed).toBe(true);
    expect(items[0]?.title).toBe(MOCK_UNSAFE_TITLE);
  });

  it('omits the description of an item that has none', () => {
    const { items } = parseRssFeed(
      buildRssFeed(MOCK_CHANNEL, [{ ...MOCK_ITEM, description: undefined }]),
    );

    expect(items[0]?.description).toBeUndefined();
  });

  it('produces an empty channel with no build date when there are no items', () => {
    const { channel, items } = parseRssFeed(buildRssFeed(MOCK_CHANNEL, []));

    expect(items).toEqual([]);
    expect(channel.lastBuildDate).toBeUndefined();
  });

  it('is parseable as an RSS document', () => {
    const { isWellFormed, root, items } = parseRssFeed(
      buildRssFeed(MOCK_CHANNEL, [MOCK_ITEM]),
    );

    expect(isWellFormed).toBe(true);
    expect(root).toBe('rss');
    expect(items).toHaveLength(1);
  });
});
