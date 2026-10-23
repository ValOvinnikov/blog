import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { getRssSelfLink } from '@web/testing/shared/rss/get-rss-self-link';

const XML_CONTENT_TYPE = 'application/xml';
const PARSER_ERROR_TAG = 'parsererror';

type TRssFields = Record<string, TMaybeNull<string>>;

interface IRssFeed {
  isWellFormed: boolean;
  root: string;
  channel: TRssFields;
  items: TRssFields[];
  selfLink: TRssFields;
}

const isLeaf = (element: Element): boolean => element.children.length === 0;

const toFields = (elements: Element[]): TRssFields =>
  Object.fromEntries(
    elements.map(({ tagName, textContent }) => [tagName, textContent]),
  );

const toAttributes = (element: TMaybeUndefined<Element>): TRssFields =>
  Object.fromEntries(
    Array.from(element?.attributes ?? []).map(({ name, value }) => [
      name,
      value,
    ]),
  );

export const parseRssFeed = (xml: string): IRssFeed => {
  const doc = new DOMParser().parseFromString(xml, XML_CONTENT_TYPE);
  const channelChildren = Array.from(
    doc.documentElement.firstElementChild?.children ?? [],
  );

  return {
    isWellFormed: doc.getElementsByTagName(PARSER_ERROR_TAG).length === 0,
    root: doc.documentElement.tagName,
    channel: toFields(channelChildren.filter(isLeaf)),
    items: channelChildren
      .filter((child) => !isLeaf(child))
      .map((item) => toFields(Array.from(item.children))),
    selfLink: toAttributes(getRssSelfLink(doc)),
  };
};
