import {
  toCtaButton,
  type TCtaButton,
  type TRawCtaButton,
} from '@blog/service/shared/transformers/to-cta-button';

export function toCtaButtons(
  raw: readonly TRawCtaButton[] | null | undefined,
): TCtaButton[] {
  if (!raw || raw.length === 0) return [];

  return raw
    .map(toCtaButton)
    .filter((button): button is TCtaButton => button !== undefined);
}
