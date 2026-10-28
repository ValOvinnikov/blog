import type {
  Module_content,
  Module_cta,
  Module_heroProfile,
  Module_postList,
  Person,
} from '@blog/config/sanity/generated/types';

import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  HERO_VARIANT,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import type { TStarterDocument, TStarterModule } from './starter-document';
import {
  localizedArticleText,
  localizedString,
  moduleHeadingBlock,
  reference,
} from './starter-fields';

type TModuleInput = {
  id: string;
  title: string;
  locale: TLocaleIsoCode;
};

const POST_LIST_PAGE_SIZE = 12;

export function buildAuthor(
  id: string,
  siteName: string,
): TStarterDocument<Person, 'name'> {
  return { _id: id, _type: 'person', name: siteName };
}

export function buildProfileHero({
  id,
  title,
  locale,
  eyebrow,
  heading,
  authorId,
}: TModuleInput & {
  eyebrow: string;
  heading: string;
  authorId: string;
}): TStarterModule<Module_heroProfile> {
  return {
    _id: id,
    _type: 'module_heroProfile',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.STACKED,
    headingBlock: moduleHeadingBlock(locale, heading),
    eyebrow: localizedString(locale, eyebrow),
    author: reference(authorId),
  };
}

export function buildContentModule({
  id,
  title,
  locale,
  body,
}: TModuleInput & { body: readonly string[] }): TStarterModule<Module_content> {
  return {
    _id: id,
    _type: 'module_content',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: localizedArticleText(locale, body),
  };
}

export function buildCalloutCta({
  id,
  title,
  locale,
  heading,
  supportingText,
  linkId,
}: TModuleInput & {
  heading: string;
  supportingText: string;
  linkId: string;
}): TStarterModule<Module_cta> {
  return {
    _id: id,
    _type: 'module_cta',
    title,
    brandVariant: BRAND_VARIANT.SECONDARY,
    bandTone: BRAND_VARIANT.PRIMARY,
    variant: CTA_VARIANT.CALLOUT,
    headingBlock: moduleHeadingBlock(locale, heading, supportingText),
    ctaButtons: [
      {
        _key: linkId,
        _type: 'ctaButton',
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link: reference(linkId),
      },
    ],
  };
}

export function buildPostListModule({
  id,
  title,
  locale,
  heading,
}: TModuleInput & { heading: string }): TStarterModule<Module_postList> {
  return {
    _id: id,
    _type: 'module_postList',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    pageSize: POST_LIST_PAGE_SIZE,
  };
}
