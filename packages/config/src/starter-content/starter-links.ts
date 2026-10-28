import type { Link } from '@blog/config/sanity/generated/types';

import {
  LINK_TYPE,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import type { TStarterDocument } from './starter-document';
import { localizedString, reference } from './starter-fields';

export function navigationLink(linkId: string) {
  return {
    _key: linkId,
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: reference(linkId),
  };
}

export function internalLink(
  id: string,
  title: string,
  locale: TLocaleIsoCode,
  targetId: string,
): TStarterDocument<Link, 'title' | 'label' | 'linkType'> {
  return {
    _id: id,
    _type: 'link',
    title,
    label: localizedString(locale, title),
    linkType: LINK_TYPE.INTERNAL,
    internalReference: reference(targetId),
  };
}
