import { isUndefined } from '@blog/utils/primitives';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { SUMMARY_JOINER } from '@platform/constants/summary';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';

const join = (parts: readonly string[]): string => parts.join(SUMMARY_JOINER);

export const buildLookRowSummaries = (
  values: TLookFormValues,
  t: TLooseTranslator,
  { hasMultipleLanguages }: { hasMultipleLanguages: boolean },
): Record<TLookRow, string> => {
  const {
    accentHue,
    logoHue,
    logo,
    favicon,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    cardStyle,
    headerControlStyle,
    busyButtonStyle,
    spinnerStyle,
    headerLayout,
    headerBarStyle,
    headerSubmenuStyle,
    accountButtonStyle,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
    languageSwitcherStyle,
  } = values;

  return {
    [LOOK_ROW.COLOUR]: join([
      t('summaryHue', { hue: accentHue }),
      isUndefined(logoHue)
        ? t('summaryLogoFollowsAccent')
        : t('summaryLogoHue', { hue: logoHue }),
    ]),
    [LOOK_ROW.BRAND]: join([
      t(isUndefined(logo.url) ? 'summaryNoLogo' : 'summaryLogoUploaded'),
      t(
        isUndefined(favicon.url)
          ? 'summaryNoFavicon'
          : 'summaryFaviconUploaded',
      ),
    ]),
    [LOOK_ROW.TYPE]: join([
      FONT_OPTIONS[headingFont].label,
      FONT_OPTIONS[bodyFont].label,
    ]),
    [LOOK_ROW.SHAPE]: join([
      t(`radiusScaleOptionLabel.${radiusScale}`),
      t(`densityOptionLabel.${density}`),
      t(`cardStyleOptionLabel.${cardStyle}`),
      t(`headerControlStyleOptionLabel.${headerControlStyle}`),
    ]),
    [LOOK_ROW.BUTTONS]: join([
      t(`busyButtonStyleOptionLabel.${busyButtonStyle}`),
      t(`spinnerStyleOptionLabel.${spinnerStyle}`),
    ]),
    [LOOK_ROW.HEADER]: join([
      t(`headerLayoutOptionLabel.${headerLayout}`),
      t(`headerBarStyleOptionLabel.${headerBarStyle}`),
      t(`headerSubmenuStyleOptionLabel.${headerSubmenuStyle}`),
      t(`accountButtonStyleOptionLabel.${accountButtonStyle}`),
    ]),
    [LOOK_ROW.FOOTER]: join([
      t(`footerLayoutOptionLabel.${footerLayout}`),
      t(`footerBackgroundOptionLabel.${footerBackground}`),
      t(`footerSurfaceOptionLabel.${footerSurface}`),
      t(`cookieSettingsButtonSummary.${cookieSettingsButton}`),
    ]),
    [LOOK_ROW.LANGUAGE_SWITCHER]: join([
      t(`languageSwitcherOptionLabel.${languageSwitcherStyle}`),
      ...(hasMultipleLanguages ? [] : [t('summaryOneLanguage')]),
    ]),
  };
};
