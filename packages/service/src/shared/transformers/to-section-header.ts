import type { TMaybeUndefined, TSectionHeader } from '@blog/config';
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
};

export function toSectionHeader(raw: TRawSectionHeader): TSectionHeader {
  return {
    heading: raw.heading ?? undefined,
    supportingText: raw.supportingText ?? undefined,
  };
}

export function toRequiredSectionHeader(
  raw: TRawRequiredSectionHeader,
): TRequiredSectionHeader {
  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
  };
}
