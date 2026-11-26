import messages from '@platform/i18n/messages/en.json';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';

const { lookForm: LOOK_FORM } = messages;
const tLogoHue = makeEnTranslator('logoHueField');
const tSaveBar = makeEnTranslator('saveBar');
const tLookForm = makeEnTranslator('lookForm');

export const ACCENT_HUE = LOOK_FORM.accentHueLabel;
export const DEFAULT_ACCENT_HUE = defaultLookFormValues().accentHue;
export const NUDGED_ACCENT_HUE = DEFAULT_ACCENT_HUE + 1;
export const EDITORIAL_ACCENT_HUE =
  PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue;
export const MOCK_SAVED_ACCENT_HUE = 260;
export const FOLLOW_ACCENT_HUE = messages.logoHueField.followAccentHue;
export const UPLOAD_FAVICON = messages.assetUploadField.favicon.upload;
export const BRAND_IMAGES_HINT = LOOK_FORM.brandFieldsHint;
export const RESET_TO_PRESET = LOOK_FORM.resetButton;
export const EXTRA_LARGE = LOOK_FORM.radiusScaleOptionLabel.XL;
export const COMPACT = LOOK_FORM.densityOptionLabel.COMPACT;
export const OUTLINED = LOOK_FORM.cardStyleOptionLabel.OUTLINED;
export const HEADER_LAYOUT_LABEL = LOOK_FORM.headerLayoutLabel;
export const SPINNER_LABEL = LOOK_FORM.spinnerStyleLabel;
export const FOOTER_LAYOUT_LABEL = LOOK_FORM.footerLayoutLabel;
export const GROWTH = messages.growthBadge.label;
export const GROWTH_BADGE_TEXT = `${GROWTH} ${messages.growthBadge.planNote}`;
export const EDITORIAL = messages.presetPicker.editorial;
export const CONSOLE = messages.presetPicker.console;
export const GROWTH_FIELDS_LINE = tLookForm('lockLineGrowthFields', {
  preset: CONSOLE,
});
export const RADIUS_SCALE = LOOK_FORM.radiusScaleLabel;
export const DENSITY = LOOK_FORM.densityLabel;
export const FREE_LOOK_FIELDS = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].lookFields;
export const DISCARD = tSaveBar('discard');
export const EDIT_TAB = messages.viewTabs.editTab;
export const PREVIEW_TAB = messages.viewTabs.previewTab;

export const hueValue = (hue: number) => tLogoHue('hueValue', { hue });

export const savedLookValues = (overrides: Partial<TLookFormValues> = {}) => {
  const defaults = defaultLookFormValues();

  return {
    preset: defaults.preset,
    accentHue: defaults.accentHue,
    logoHue: null,
    headingFont: defaults.headingFont,
    bodyFont: defaults.bodyFont,
    radiusScale: defaults.radiusScale,
    density: defaults.density,
    cardStyle: defaults.cardStyle,
    headerControlStyle: defaults.headerControlStyle,
    headerControlShape: defaults.headerControlShape,
    headerActionStyle: defaults.headerActionStyle,
    headerActionPhonePlacement: defaults.headerActionPhonePlacement,
    headerLayout: defaults.headerLayout,
    headerSubmenuStyle: defaults.headerSubmenuStyle,
    headerBarStyle: defaults.headerBarStyle,
    headerBackground: defaults.headerBackground,
    breadcrumbBackground: defaults.breadcrumbBackground,
    navLinkStyle: defaults.navLinkStyle,
    headingWeight: defaults.headingWeight,
    headingCase: defaults.headingCase,
    imageProportion: defaults.imageProportion,
    dividerWidth: defaults.dividerWidth,
    colorMode: defaults.colorMode,
    accountButtonStyle: defaults.accountButtonStyle,
    accountPanelStyle: defaults.accountPanelStyle,
    accountPhonePlacement: defaults.accountPhonePlacement,
    busyButtonStyle: defaults.busyButtonStyle,
    spinnerStyle: defaults.spinnerStyle,
    buttonShape: defaults.buttonShape,
    buttonColor: null,
    buttonColorDark: null,
    footerLayout: defaults.footerLayout,
    footerBackground: defaults.footerBackground,
    footerSurface: defaults.footerSurface,
    cookieSettingsButton: defaults.cookieSettingsButton,
    languageSwitcherStyle: defaults.languageSwitcherStyle,
    brandName: defaults.brandName,
    ...overrides,
  };
};
