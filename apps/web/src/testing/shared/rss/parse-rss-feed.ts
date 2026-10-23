import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { getRssSelfLink } from '@web/testing/shared/rss/get-rss-self-link';

const XML_CONTENT_TYPE = 'application/xml';

interface IRssItem {
  title: TMaybeNull<string>;
  link: TMaybeNull<string>;
  description: TMaybeNull<string>;
  pubDate: TMaybeNull<string>;
}

interface IRssFeed {
  isWellFormed: boolean;
  title: TMaybeNull<string>;
  description: TMaybeNull<string>;
  language: TMaybeNull<string>;
  link: TMaybeNull<string>;
  selfLink: TMaybeNull<string>;
  items: IRssItem[];
}

const childText = (
  parent: TMaybeUndefined<Element>,
  tagName: string,
): TMaybeNull<string> =>
  Array.from(parent?.children ?? []).find((child) => child.tagName === tagName)
    ?.textContent ?? null;

export const parseRssFeed = (xml: string): IRssFeed => {
  const doc = new DOMParser().parseFromString(xml, XML_CONTENT_TYPE);
  const [channel] = Array.from(doc.getElementsByTagName('channel'));

  return {
    isWellFormed: doc.getElementsByTagName('parsererror').length === 0,
    title: childText(channel, 'title'),
    description: childText(channel, 'description'),
    language: childText(channel, 'language'),
    link: childText(channel, 'link'),
    selfLink: getRssSelfLink(doc)?.getAttribute('href') ?? null,
    items: Array.from(doc.getElementsByTagName('item')).map((item) => ({
      title: childText(item, 'title'),
      link: childText(item, 'link'),
      description: childText(item, 'description'),
      pubDate: childText(item, 'pubDate'),
    })),
  };
};
