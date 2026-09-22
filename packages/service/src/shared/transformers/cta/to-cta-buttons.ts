import {
  toCtaButton,
  type TCtaButton,
  type TRawCtaButton,
} from '@blog/service/shared/transformers/cta/to-cta-button';

export function toCtaButtons(
  raw: TRawCtaButton[] | null | undefined,
): TCtaButton[] {
  return (raw ?? []).flatMap((item) => toCtaButton(item) ?? []);
}
