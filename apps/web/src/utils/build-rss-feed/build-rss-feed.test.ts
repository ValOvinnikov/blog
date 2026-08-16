import { buildRssFeed, type TRssItem } from './build-rss-feed';

const channel = {
  title: 'The Blog',
  description: 'Latest posts',
  siteUrl: 'https://example.com',
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
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('<title>The Blog</title>');
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<description>Latest posts</description>');
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

  it('produces an empty channel (no items) without throwing', () => {
    const xml = buildRssFeed(channel, []);

    expect(xml).toContain('<rss version="2.0">');
    expect(xml).not.toContain('<item>');
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
