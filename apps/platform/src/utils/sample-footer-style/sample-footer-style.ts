import type {
  TBrandVariant,
  TFooterLayout,
  TFooterSurface,
} from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TSampleFooterStyle = {
  layout: TFooterLayout;
  tone: TBrandVariant;
  surface: TFooterSurface;
};

export const toSampleFooterStyle = ({
  footerLayout,
  footerBackground,
  footerSurface,
}: Pick<
  TLookFormValues,
  'footerLayout' | 'footerBackground' | 'footerSurface'
>): TSampleFooterStyle => ({
  layout: footerLayout,
  tone: footerBackground,
  surface: footerSurface,
});
