import type {
  TBrandVariant,
  TCookieSettingsButton,
  TFooterLayout,
  TFooterSurface,
} from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TSampleFooterStyle = {
  layout: TFooterLayout;
  tone: TBrandVariant;
  surface: TFooterSurface;
  cookieSettingsButton: TCookieSettingsButton;
};

export const toSampleFooterStyle = ({
  footerLayout,
  footerBackground,
  footerSurface,
  cookieSettingsButton,
}: Pick<
  TLookFormValues,
  'footerLayout' | 'footerBackground' | 'footerSurface' | 'cookieSettingsButton'
>): TSampleFooterStyle => ({
  layout: footerLayout,
  tone: footerBackground,
  surface: footerSurface,
  cookieSettingsButton,
});
