import { FONT_OPTIONS } from '@platform/config/fonts';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { SUMMARY_JOINER } from '@platform/constants/summary';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { isUndefined } from '@shinefold/utils/primitives';

const join = (parts: readonly string[]): string => parts.join(SUMMARY_JOINER);

export const buildLookRowSummaries = (
  values: TLookFormValues,
  t: TLooseTranslator,
  { hasMultipleLanguages }: { hasMultipleLanguages: boolean },
): Record<TLookRow, string> => {
  const {
    accentHue,
    logoHue,
    colorMode,
    logo,
    logoDark,
    favicon,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    cardStyle,
    headerControlStyle,
    headerActionStyle,
    buttonShape,
    busyButtonStyle,
    spinnerStyle,
    headerLayout,
    headerBarStyle,
    headerSubmenuStyle,
    navLinkStyle,
    accountButtonStyle,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
    languageSwitcherStyle,
  } = values;

  return {
    [LOOK_ROW.BRAND]: join([
      t(isUndefined(logo.url) ? 'summaryNoLogo' : 'summaryLogoUploaded'),
      t(
        isUndefined(logoDark.url)
          ? 'summaryNoLogoDark'
          : 'summaryLogoDarkUploaded',
      ),
      isUndefined(logoHue)
        ? t('summaryLogoFollowsAccent')
        : t('summaryLogoHue', { hue: logoHue }),
      t(
        isUndefined(favicon.url)
          ? 'summaryNoFavicon'
          : 'summaryFaviconUploaded',
      ),
    ]),
    [LOOK_ROW.COLOUR]: join([
      t('summaryHue', { hue: accentHue }),
      t(`colorModeOptionLabel.${colorMode}`),
    ]),
    [LOOK_ROW.TYPE]: join([
      FONT_OPTIONS[headingFont].label,
      FONT_OPTIONS[bodyFont].label,
    ]),
    [LOOK_ROW.SHAPE]: join([
      t(`radiusScaleOptionLabel.${radiusScale}`),
      t(`buttonShapeOptionLabel.${buttonShape}`),
      t(`densityOptionLabel.${density}`),
      t(`cardStyleOptionLabel.${cardStyle}`),
    ]),
    [LOOK_ROW.HEADER]: join([
      t(`headerLayoutOptionLabel.${headerLayout}`),
      t(`headerBarStyleOptionLabel.${headerBarStyle}`),
      t(`headerSubmenuStyleOptionLabel.${headerSubmenuStyle}`),
      t(`navLinkStyleOptionLabel.${navLinkStyle}`),
      t(`headerControlStyleOptionLabel.${headerControlStyle}`),
      ...(hasMultipleLanguages
        ? [t(`languageSwitcherOptionLabel.${languageSwitcherStyle}`)]
        : []),
      t(`headerActionStyleSummary.${headerActionStyle}`),
      t(`accountButtonStyleOptionLabel.${accountButtonStyle}`),
    ]),
    [LOOK_ROW.FOOTER]: join([
      t(`footerLayoutOptionLabel.${footerLayout}`),
      t(`skinLabel.${footerBackground}`),
      t(`footerSurfaceOptionLabel.${footerSurface}`),
    ]),
    [LOOK_ROW.DETAILS]: join([
      t(`spinnerStyleOptionLabel.${spinnerStyle}`),
      t(`busyButtonStyleOptionLabel.${busyButtonStyle}`),
      t(`cookieSettingsButtonSummary.${cookieSettingsButton}`),
    ]),
  };
};
