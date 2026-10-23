/**
 * @vitest-environment jsdom
 */
import { parseRssFeed } from '@web/testing/shared/rss/parse-rss-feed';

import { buildRssFeed, type TRssItem } from './build-rss-feed';

const FEED_URL = 'https://example.com/nl/rss.xml';
const LATEST_PUBLISHED_AT = '2026-03-01T00:00:00Z';

const channel = {
  title: 'The Blog',
  description: 'Latest posts',
  link: 'https://example.com/nl',
  language: 'nl',
  feedUrl: FEED_URL,
};

const item: TRssItem = {
  title: 'Hello World',
  link: 'https://example.com/blog/hello-world',
  description: 'A sufficiently long excerpt.',
  publishedAt: '2026-01-15T00:00:00Z',
};

describe(buildRssFeed, () => {
  it('builds a valid RSS 2.0 document with channel metadata', () => {
    const xml = buildRssFeed(channel, [item]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<title>The Blog</title>');
    expect(xml).toContain('<link>https://example.com/nl</link>');
    expect(xml).toContain('<description>Latest posts</description>');
    expect(xml).toContain('<language>nl</language>');
  });

  it('links the channel to its own feed URL', () => {
    const { selfLink } = parseRssFeed(buildRssFeed(channel, [item]));

    expect(selfLink).toEqual({
      href: FEED_URL,
      rel: 'self',
      type: 'application/rss+xml',
    });
  });

  it("dates the build to the newest item's publication", () => {
    const xml = buildRssFeed(channel, [
      item,
      { ...item, publishedAt: LATEST_PUBLISHED_AT },
      { ...item, publishedAt: '2025-12-01T00:00:00Z' },
    ]);

    expect(xml).toContain(
      `<lastBuildDate>${new Date(LATEST_PUBLISHED_AT).toUTCString()}</lastBuildDate>`,
    );
  });

  it('renders each item with title, link, description and pubDate', () => {
    const xml = buildRssFeed(channel, [item]);

    expect(xml).toContain('<title>Hello World</title>');
    expect(xml).toContain('<link>https://example.com/blog/hello-world</link>');
    expect(xml).toContain(
      '<description>A sufficiently long excerpt.</description>',
    );
    expect(xml).toContain(new Date(item.publishedAt).toUTCString());
  });

  it('escapes XML-reserved characters in item titles', () => {
    const xml = buildRssFeed(channel, [{ ...item, title: 'A & B <script>' }]);

    expect(xml).toContain('<title>A &amp; B &lt;script&gt;</title>');
    expect(xml).not.toContain('<title>A & B <script>');
  });

  it('omits the description element entirely when an item has none', () => {
    const xml = buildRssFeed(channel, [{ ...item, description: undefined }]);
    const itemXml = xml.slice(xml.indexOf('<item>'));

    expect(itemXml).not.toContain('<description>');
  });

  it('produces an empty channel with no build date when there are no items', () => {
    const xml = buildRssFeed(channel, []);

    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
    expect(xml).not.toContain('<lastBuildDate>');
  });

  it('is parseable as XML', () => {
    const { isWellFormed, root, items } = parseRssFeed(
      buildRssFeed(channel, [item]),
    );

    expect(isWellFormed).toBe(true);
    expect(root).toBe('rss');
    expect(items).toHaveLength(1);
  });
});
