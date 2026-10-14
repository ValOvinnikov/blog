/**
 * @vitest-environment jsdom
 */
import { getRssSelfLink } from '@web/testing/shared/rss/get-rss-self-link';

import { buildRssFeed, type TRssItem } from './build-rss-feed';

const channel = {
  title: 'The Blog',
  description: 'Latest posts',
  link: 'https://example.com/nl',
  language: 'nl',
  feedUrl: 'https://example.com/nl/rss.xml',
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
    const doc = new DOMParser().parseFromString(
      buildRssFeed(channel, [item]),
      'application/xml',
    );
    const selfLink = getRssSelfLink(doc);

    expect(selfLink?.getAttribute('href')).toBe(
      'https://example.com/nl/rss.xml',
    );
    expect(selfLink?.getAttribute('rel')).toBe('self');
    expect(selfLink?.getAttribute('type')).toBe('application/rss+xml');
  });

  it("dates the build to the newest item's publication", () => {
    const xml = buildRssFeed(channel, [
      item,
      { ...item, publishedAt: '2026-03-01T00:00:00Z' },
      { ...item, publishedAt: '2025-12-01T00:00:00Z' },
    ]);

    expect(xml).toContain(
      `<lastBuildDate>${new Date('2026-03-01T00:00:00Z').toUTCString()}</lastBuildDate>`,
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
    const xml = buildRssFeed(channel, [item]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.querySelector('parsererror');

    expect(parserError).toBeNull();
    expect(doc.querySelector('rss')).not.toBeNull();
    expect(doc.querySelectorAll('item')).toHaveLength(1);
  });
});
