import { escapeXml } from '@web/utils/escape-xml';

export type TRssChannel = {
  title: string;
  description: string;
  siteUrl: string;
};

export type TRssItem = {
  title: string;
  link: string;
  description: string;
  /** ISO 8601 — converted to RFC-822 (`pubDate`'s required format) internally. */
  publishedAt: string;
};

function toRssItemXml(item: TRssItem): string {
  const pubDate = new Date(item.publishedAt).toUTCString();

  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
}

/**
 * Builds a valid RSS 2.0 XML string from a channel + its items. Every text
 * field is XML-escaped — callers pass raw CMS-authored strings (titles,
 * excerpts) straight through without pre-escaping.
 */
export function buildRssFeed(channel: TRssChannel, items: TRssItem[]): string {
  const itemsXml = items.map(toRssItemXml).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.siteUrl)}</link>
    <description>${escapeXml(channel.description)}</description>
${itemsXml}
  </channel>
</rss>`;
}
