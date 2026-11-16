import type { TMaybeUndefined } from '@shinefold/config';

export const getRssSelfLink = (doc: Document): TMaybeUndefined<Element> =>
  doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
