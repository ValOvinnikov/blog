import {
  COOKIE_SETTINGS_BUTTON,
  type TCookieSettingsButton,
} from '@blog/config';

type TCookieSettingsControls = {
  hasCookieSettingsLink: boolean;
  hasCookieSettingsButton: boolean;
};

export const resolveCookieSettingsControls = (
  cookieSettingsButton: TCookieSettingsButton,
  isConsentBannerEnabled: boolean,
): TCookieSettingsControls => ({
  hasCookieSettingsLink:
    isConsentBannerEnabled &&
    cookieSettingsButton !== COOKIE_SETTINGS_BUTTON.ONLY,
  hasCookieSettingsButton:
    isConsentBannerEnabled &&
    cookieSettingsButton !== COOKIE_SETTINGS_BUTTON.HIDDEN,
});
