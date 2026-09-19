import { CTA_ACTION_VARIANT } from '@blog/config/constants';

import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

const CTA_BUTTON_TYPE = 'ctaButton';

/** Mirrors `cta-buttons-field.ts`'s default `max` for the `ctaButtons` array. */
const CTA_BUTTONS_MAX = 2;

export type TLegacyInlineLink = {
  label?: string;
  accessibleLabel?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
  openInNewTab?: boolean;
  platform?: string;
};

export type TLegacyCtaAction = {
  _key: string;
  variant?: string;
  appearance?: string;
  link?: TLegacyInlineLink;
};

export type TCtaButtonNode = {
  _key: string;
  _type: typeof CTA_BUTTON_TYPE;
  variant?: string;
  appearance?: string;
  link: { _type: 'reference'; _ref: string };
};

/**
 * Builds a flat `ctaButton` entry from its legacy `ctaAction`, preserving
 * the original `_key`/`variant`/`appearance` and pointing at the deduped
 * `link` document instead of embedding the destination inline.
 */
export const buildCtaButton = (
  action: TLegacyCtaAction,
  linkId: string,
): TCtaButtonNode => ({
  _key: action._key,
  _type: CTA_BUTTON_TYPE,
  variant: action.variant,
  appearance: action.appearance,
  link: { _type: 'reference', _ref: linkId },
});

export const hasMissingLabel = (link: TLegacyInlineLink): boolean =>
  !link.label?.trim();

export const hasOversizedLabel = (link: TLegacyInlineLink): boolean =>
  Boolean(link.label && link.label.length > LINK_LABEL_MAX_LENGTH);

export type TOrderingIssue =
  | { type: 'TOO_MANY_BUTTONS'; count: number }
  | { type: 'DUPLICATE_VARIANT'; variant: string }
  | { type: 'PRIMARY_NOT_FIRST' };

/**
 * Flags every way a legacy `actions[]` array would fail the new
 * `ctaButtons` validation — too many entries, a repeated variant, or a
 * Primary not listed first. Detection only: the caller decides what to do,
 * this never reorders or drops anything itself.
 */
export const detectOrderingIssues = (
  actions: TLegacyCtaAction[],
): TOrderingIssue[] => {
  const issues: TOrderingIssue[] = [];

  if (actions.length > CTA_BUTTONS_MAX) {
    issues.push({ type: 'TOO_MANY_BUTTONS', count: actions.length });
  }

  const seenVariants = new Set<string>();

  for (const action of actions) {
    if (!action.variant) continue;

    if (seenVariants.has(action.variant)) {
      issues.push({ type: 'DUPLICATE_VARIANT', variant: action.variant });
    }

    seenVariants.add(action.variant);
  }

  const primaryIndex = actions.findIndex(
    (action) => action.variant === CTA_ACTION_VARIANT.PRIMARY,
  );

  if (primaryIndex > 0) {
    issues.push({ type: 'PRIMARY_NOT_FIRST' });
  }

  return issues;
};
