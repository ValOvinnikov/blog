import type {
  TMaybeUndefined,
  THeadingAlign,
  TSectionHeader,
} from '@blog/config';
import type {
  requiredSectionHeaderFragment,
  sectionHeaderFragment,
} from '@blog/service/shared/fragments/section-header';
import type { InferFragmentType } from 'groqd';

export type TRawSectionHeader = InferFragmentType<typeof sectionHeaderFragment>;
export type TRawRequiredSectionHeader = InferFragmentType<
  typeof requiredSectionHeaderFragment
>;

export type TRequiredSectionHeader = {
  heading: string;
  supportingText: TMaybeUndefined<string>;
  align: TMaybeUndefined<THeadingAlign>;
};

export function toSectionHeader(raw: TRawSectionHeader): TSectionHeader {
  return {
    heading: raw.heading ?? undefined,
    supportingText: raw.supportingText ?? undefined,
    align: raw.align ?? undefined,
  };
}

export function toRequiredSectionHeader(
  raw: TRawRequiredSectionHeader,
): TRequiredSectionHeader {
  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
    align: raw.align ?? undefined,
  };
}
