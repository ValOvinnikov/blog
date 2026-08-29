import { TLINK_TYPE, type BasicText, type TMaybeUndefined } from '@blog/config';
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

// `content` only allows the `link` annotation (`basicText.ts`'s schema), so
// every `markDefs` entry resolves through the same internal/external logic
// `toLink` uses for actions — but unlike an action, a malformed link here
// degrades to plain text (renderer checks `annotation.url`) rather than
// dropping the block, so the annotation is always kept.
function toContentLinkAnnotation(
  raw: TRawCtaContentMarkDef,
): TCtaContentMarkDef {
  const url =
    raw.linkType === TLINK_TYPE.INTERNAL && raw.internalReference
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

function toCtaAction(raw: TRawCtaAction): TCtaAction | undefined {
  const link = toLink(raw.link);
  if (!link) return undefined;

  return {
    variant: raw.variant,
    appearance: raw.appearance ?? undefined,
    link,
  };
}

function toCtaActions(raw: TRawCtaModule['actions']): TCtaAction[] | undefined {
  const items = raw?.actions;
  if (!items || items.length === 0) return undefined;

  const actions = items
    .map(toCtaAction)
    .filter((action): action is TCtaAction => action !== undefined);

  return actions.length > 0 ? actions : undefined;
}

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    variant: raw.variant,
    brandVariant: raw.brandVariant,
    eyebrow: raw.eyebrow ?? undefined,
    sectionHeader: toRequiredSectionHeader(raw.sectionHeader),
    content: toContent(raw.content),
    image: toSanityImage(raw.image),
    imageSide: raw.imageSide ?? undefined,
    mobileMediaOrder: raw.mobileMediaOrder ?? undefined,
    actions: toCtaActions(raw.actions),
    footnote: raw.footnote ?? undefined,
    layout: toLayout(raw.layout),
  };
}
