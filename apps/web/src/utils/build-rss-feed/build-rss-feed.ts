import { escapeXml } from '@web/utils/escape-xml';

export type TRssChannel = {
  title: string;
  description: string;
  link: string;
  language: string;
  feedUrl: string;
};

export type TRssItem = {
  title: string;
  link: string;
  description?: string;
  /** ISO 8601 — converted to RFC-822 (`pubDate`'s required format) internally. */
  publishedAt: string;
};

const toRfc822 = (isoDate: string): string => new Date(isoDate).toUTCString();

const toRssItemXml = (item: TRssItem): string => {
  const descriptionLine = item.description
    ? `\n      <description>${escapeXml(item.description)}</description>`
    : '';

  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>${descriptionLine}
      <pubDate>${toRfc822(item.publishedAt)}</pubDate>
    </item>`;
};

const toLastBuildDateLine = (items: TRssItem[]): string => {
  if (!items.length) {
    return '';
  }
  const newest = Math.max(
    ...items.map(({ publishedAt }) => Date.parse(publishedAt)),
  );

  return `\n    <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>`;
};

/**
 * Every text field is XML-escaped — callers pass raw CMS-authored strings
 * (titles, excerpts) straight through without pre-escaping.
 */
export const buildRssFeed = (
  channel: TRssChannel,
  items: TRssItem[],
): string => {
  const itemsXml = items.map(toRssItemXml).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml"/>${toLastBuildDateLine(items)}
${itemsXml}
  </channel>
</rss>`;
};
