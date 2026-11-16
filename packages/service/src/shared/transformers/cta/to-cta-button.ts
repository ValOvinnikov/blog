import type {
  ILink,
  TCtaActionAppearance,
  TCtaActionVariant,
  TMaybeUndefined,
} from '@shinefold/config';
import type {
  ctaButtonFragment,
  ctaSecondaryButtonFragment,
} from '@shinefold/service/shared/fragments/cta/cta-button';
import { toLinkDocument } from '@shinefold/service/shared/transformers/link/to-link-document';
import type { InferFragmentType } from 'groqd';

export type TRawCtaButton = InferFragmentType<typeof ctaButtonFragment>;
type TRawCtaSecondaryButton = InferFragmentType<
  typeof ctaSecondaryButtonFragment
>;

export type TCtaButton = {
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  link: ILink;
};

export function toCtaButton(
  raw: TRawCtaButton | TRawCtaSecondaryButton,
): TMaybeUndefined<TCtaButton> {
  const link = toLinkDocument(raw.link);
  if (!link) return undefined;

  return {
    variant: raw.variant,
    appearance: raw.appearance ?? undefined,
    link,
  };
}
