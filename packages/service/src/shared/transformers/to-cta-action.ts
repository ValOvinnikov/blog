import type {
  ILink,
  TCtaActionAppearance,
  TCtaActionVariant,
  TMaybeUndefined,
} from '@blog/config';
import type { ctaActionFragment } from '@blog/service/shared/fragments/action-group';
import { toLink } from '@blog/service/shared/transformers/to-link';
import type { InferFragmentType } from 'groqd';

export type TRawCtaAction = InferFragmentType<typeof ctaActionFragment>;

export type TCtaAction = {
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  link: ILink;
};

export function toCtaAction(raw: TRawCtaAction): TCtaAction | undefined {
  const link = toLink(raw.link);
  if (!link) return undefined;

  return {
    variant: raw.variant,
    appearance: raw.appearance ?? undefined,
    link,
  };
}
