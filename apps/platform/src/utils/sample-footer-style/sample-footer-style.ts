import {
  COOKIE_SETTINGS_BUTTON,
  type TBrandVariant,
  type TFooterLayout,
  type TFooterSurface,
} from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TSampleFooterStyle = {
  layout: TFooterLayout;
  tone: TBrandVariant;
  surface: TFooterSurface;
  hasCookieSettingsLink: boolean;
  hasCookieSettingsButton: boolean;
};

export const toSampleFooterStyle = (
  {
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
  }: Pick<
    TLookFormValues,
    | 'footerLayout'
    | 'footerBackground'
    | 'footerSurface'
    | 'cookieSettingsButton'
  >,
  hasCookieBanner: boolean,
): TSampleFooterStyle => ({
  layout: footerLayout,
  tone: footerBackground,
  surface: footerSurface,
  hasCookieSettingsLink:
    hasCookieBanner && cookieSettingsButton !== COOKIE_SETTINGS_BUTTON.ONLY,
  hasCookieSettingsButton:
    hasCookieBanner && cookieSettingsButton !== COOKIE_SETTINGS_BUTTON.HIDDEN,
});
