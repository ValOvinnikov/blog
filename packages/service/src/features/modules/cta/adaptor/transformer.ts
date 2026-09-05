import {
  CTA_VARIANT,
  LINK_TYPE,
  type BasicText,
  type TContentAlignment,
  type TMaybeUndefined,
} from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import {
  toInternalHref,
  toLink,
} from '@blog/service/shared/transformers/to-link';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toRequiredSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaAction, TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

export type TRawCtaAction = NonNullable<
  NonNullable<TRawCtaModule['actions']>['actions']
>[number];

export type TRawCtaContentBlock = NonNullable<TRawCtaModule['content']>[number];
export type TRawCtaContentMarkDef = NonNullable<
  TRawCtaContentBlock['markDefs']
>[number];
type TCtaContentMarkDef = NonNullable<BasicText[number]['markDefs']>[number];

// Unlike an action, a malformed content link degrades to plain text rather
// than dropping the block — the renderer already handles a missing `url`.
function toContentLinkAnnotation(
  raw: TRawCtaContentMarkDef,
): TCtaContentMarkDef {
  const url =
    raw.linkType === LINK_TYPE.INTERNAL && raw.internalReference
      ? toInternalHref(raw.internalReference)
      : (raw.url ?? undefined);

  return {
    _key: raw._key,
    _type: 'link',
    label: raw.label,
    linkType: raw.linkType,
    url,
    openInNewTab: raw.openInNewTab ?? undefined,
    platform: raw.platform ?? undefined,
    accessibleLabel: raw.accessibleLabel ?? undefined,
  };
}

function toContentBlock(raw: TRawCtaContentBlock): BasicText[number] {
  return {
    ...raw,
    markDefs: raw.markDefs?.map(toContentLinkAnnotation) ?? undefined,
  };
}

function toContent(raw: TRawCtaModule['content']): TMaybeUndefined<BasicText> {
  if (!raw || raw.length === 0) return undefined;
  return raw.map(toContentBlock);
}

function toContentPosition(
  raw: TRawCtaModule,
): TMaybeUndefined<TContentAlignment> {
  switch (raw.variant) {
    case CTA_VARIANT.SPLIT:
      return raw.contentPositionSplit ?? undefined;
    case CTA_VARIANT.BANNER:
      return raw.contentPositionBanner ?? undefined;
    case CTA_VARIANT.CALLOUT:
      return undefined;
  }
}

function toCtaAction(raw: TRawCtaAction): TCtaAction | undefined {
  const link = toLink(raw.link);
  if (!link) return undefined;

  return {
    variant: raw.variant,
    appearance: raw.appearance ?? undefined,
    link,
  };
}

function toCtaActions(raw: TRawCtaModule['actions']): TCtaAction[] {
  const items = raw?.actions;
  if (!items || items.length === 0) return [];

  return items
    .map(toCtaAction)
    .filter((action): action is TCtaAction => action !== undefined);
}

export function toCtaModule(
  raw: TRawCtaModule,
  tenant: TImageTenant,
): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    bandTone: raw.bandTone,
    eyebrow: raw.eyebrow ?? undefined,
    sectionHeader: toRequiredSectionHeader(raw.sectionHeader),
    content: toContent(raw.content),
    image: toSanityImage(raw.image, tenant),
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    actions: toCtaActions(raw.actions),
    footnote: raw.footnote ?? undefined,
    layout: toLayout(raw.layout),
  };
}
