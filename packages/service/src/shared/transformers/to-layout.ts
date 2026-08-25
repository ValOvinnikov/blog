import type { TLayout, TMaybeUndefined } from '@blog/config';
import type {
  heroLayoutFragment,
  layoutFragment,
} from '@blog/service/shared/fragments/layout';
import type { InferFragmentType } from 'groqd';

export type TRawLayout = InferFragmentType<typeof layoutFragment>;
export type TRawHeroLayout = InferFragmentType<typeof heroLayoutFragment>;

export function toLayout(
  raw: TRawLayout | TRawHeroLayout | null | undefined,
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
