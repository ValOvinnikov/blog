import type { TContainerWidth, TLayout, TMaybeUndefined } from '@blog/config';
import type {
  ctaLayoutFragment,
  heroLayoutFragment,
  layoutFragment,
  wideLayoutFragment,
} from '@blog/service/shared/fragments/layout/layout';
import type { InferFragmentType } from 'groqd';

export type TRawLayout = InferFragmentType<typeof layoutFragment>;
export type TRawHeroLayout = InferFragmentType<typeof heroLayoutFragment>;
export type TRawWideLayout = InferFragmentType<typeof wideLayoutFragment>;
export type TRawCtaLayout = InferFragmentType<typeof ctaLayoutFragment>;

export type THeroLayout = Omit<TLayout, 'containerWidth'>;
export type TWideLayout = THeroLayout & {
  containerWidth?: Extract<TContainerWidth, 'WIDE' | 'FULL'>;
};

export function toLayout(
  raw: TRawWideLayout | null | undefined,
): TMaybeUndefined<TWideLayout>;
export function toLayout(
  raw: TRawHeroLayout | null | undefined,
): TMaybeUndefined<THeroLayout>;
export function toLayout(
  raw: TRawLayout | TRawCtaLayout | null | undefined,
): TMaybeUndefined<TLayout>;
export function toLayout(
  raw: TRawLayout | TRawHeroLayout | TRawWideLayout | null | undefined,
): TMaybeUndefined<TLayout> {
  if (!raw) return undefined;

  return {
    spacingTop: raw.spacingTop ?? undefined,
    spacingBottom: raw.spacingBottom ?? undefined,
    containerWidth:
      'containerWidth' in raw ? (raw.containerWidth ?? undefined) : undefined,
    dividerTop: raw.dividerTop ?? undefined,
    dividerBottom: raw.dividerBottom ?? undefined,
  };
}
