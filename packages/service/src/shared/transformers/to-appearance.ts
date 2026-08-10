import type { TAppearance } from '@blog/config';
import type { appearanceFragment } from '@blog/service/shared/fragments/appearance';
import type { InferFragmentType } from 'groqd';

export type TRawAppearance = InferFragmentType<typeof appearanceFragment>;

export function toAppearance(
  raw: TRawAppearance | null | undefined,
): TAppearance | undefined {
  if (!raw) return undefined;

  return {
    background: raw.background ?? undefined,
    spacingTop: raw.spacingTop ?? undefined,
    spacingBottom: raw.spacingBottom ?? undefined,
    containerWidth: raw.containerWidth ?? undefined,
    align: raw.align ?? undefined,
    divider: raw.divider ?? undefined,
  };
}
