import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  ACTION_OUTCOME,
  BRAND_VARIANT,
  CARD_STYLE,
  BUSY_BUTTON_STYLE,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  SAMPLE_BUSY_BUTTON_TEST_ID,
  SAMPLE_BUSY_STYLE_ATTRIBUTE,
  SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
} from '@platform/constants/sample-busy';
import { SAMPLE_FOOTER_TEST_ID } from '@platform/constants/sample-footer';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_FULL_TEST_ID,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
  SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
  SAMPLE_SUBMENU_TEST_ID,
} from '@platform/constants/sample-header';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import messages from '@platform/i18n/messages/en.json';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import {
  updateLookAction,
  type TUpdateLookResult,
} from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  clickGoToTheFirstOne,
  nudgeAccentHue,
  openLookRow,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_DESCRIPTION,
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
  UPLOAD_LOGO,
} from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(() => true),
}));

const { MOCK_UPLOADED_LOGO_URL, mockActions } = await vi.hoisted(async () => {
  const { ACTION_OUTCOME: OUTCOME } = await import('@blog/config/constants');
  const uploadedLogoUrl =
    'https://example.blob.vercel-storage.com/logo-new.png';

  return {
    MOCK_UPLOADED_LOGO_URL: uploadedLogoUrl,
    mockActions: {
      updateLookAction: vi.fn(async () => ({ outcome: OUTCOME.SUCCESS })),
      uploadBrandAssetAction: vi.fn(async () => ({
        outcome: OUTCOME.SUCCESS,
        url: uploadedLogoUrl,
      })),
      clearBrandAssetAction: vi.fn(async () => ({
        outcome: OUTCOME.SUCCESS,
      })),
    },
  };
});

vi.mock('@platform/server/site-config/update-look-action', () => ({
  updateLookAction: mockActions.updateLookAction,
}));

vi.mock('@platform/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: mockActions.uploadBrandAssetAction,
}));

vi.mock('@platform/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: mockActions.clearBrandAssetAction,
}));

faker.seed(5993);

const { lookForm: LOOK_FORM, lookPreview: LOOK_PREVIEW } = messages;
const tLogoHue = makeEnTranslator('logoHueField');
const tUploadErrors = makeEnTranslator('uploadErrors');
const tSaveBar = makeEnTranslator('saveBar');
const tDevicePreview = makeEnTranslator('devicePreview');

const UNSAVED_DOT = tSaveBar('regionLabel');

const hueValue = (hue: number) => tLogoHue('hueValue', { hue });

const ACCENT_HUE = LOOK_FORM.accentHueLabel;
const DEFAULT_ACCENT_HUE = defaultLookFormValues().accentHue;
const NUDGED_ACCENT_HUE = DEFAULT_ACCENT_HUE + 1;
const EDITORIAL_ACCENT_HUE =
  PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue;
const MOCK_SAVED_ACCENT_HUE = 260;
const REJECTED_ACCENT_HUE_DESCRIPTION = `${LOOK_FORM.accentHueDescription} ${LOOK_FORM.accentHueInaccessible}`;
const BRAND_IMAGES_HINT = LOOK_FORM.brandFieldsHint;
const LOGO_UPLOAD_FAILED = tUploadErrors('uploadFailed', { kind: 'logo' });
const FAVICON_REMOVE_FAILED = tUploadErrors('removeFailed', {
  kind: 'favicon',
});
const MOCK_UPLOAD_LIMIT = '4 MB';
const MOCK_DRAFT_TAKEN_AT = '2026-08-20T09:00:00.000Z';

const HEAVY_FORM_TIMEOUT_MS = 15_000;
const ARIA_SELECTED = 'aria-selected';
const DATA_DISABLED = 'data-disabled';
const EDIT_PANEL_TEST_ID = 'look-form-edit-panel';
const FOLLOW_ACCENT_HUE = messages.logoHueField.followAccentHue;
const UPLOAD_FAVICON = messages.assetUploadField.favicon.upload;
const RESET_TO_PRESET = LOOK_FORM.resetButton;
const USE_PRESET_RADIUS = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: LOOK_FORM.radiusScaleLabel },
);
const EXTRA_LARGE = LOOK_FORM.radiusScaleOptionLabel.XL;
const COMPACT = LOOK_FORM.densityOptionLabel.COMPACT;
const OUTLINED = LOOK_FORM.cardStyleOptionLabel.OUTLINED;
const SAVING = 'Saving…';
const GROWTH_PLAN = messages.featuresSettings.planLockedBadge;
const GROWTH_ONLY_FIELD_COUNT = 19;
const HEADER_LAYOUT_LABEL = LOOK_FORM.headerLayoutLabel;
const SPINNER_LABEL = LOOK_FORM.spinnerStyleLabel;
const FOOTER_LAYOUT_LABEL = LOOK_FORM.footerLayoutLabel;
const COOKIE_BANNER_OFF_NOTE = LOOK_FORM.cookieSettingsButtonBannerOff;
const RESTORE_CHANGES = /^Restore \d+ changes$/;
const EDITORIAL = 'Editorial';
const CONSOLE = 'Console';
const DISCARD = 'Discard';

const stubLgUpWindow = () => {
  const stubMatchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    matches: true,
  }));
};

const setupWithSavedLogo = () =>
  setupLookForm({
    initialValues: { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } },
  });

const optimizedImageSrc = (url: string) =>
  `/_next/image?url=${encodeURIComponent(url)}&w=3840&q=75`;

const savedLookValues = (overrides: Partial<TLookFormValues> = {}) => {
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
    headerLayout: defaults.headerLayout,
    headerSubmenuStyle: defaults.headerSubmenuStyle,
    headerBarStyle: defaults.headerBarStyle,
    accountButtonStyle: defaults.accountButtonStyle,
    accountPanelStyle: defaults.accountPanelStyle,
    accountPhonePlacement: defaults.accountPhonePlacement,
    busyButtonStyle: defaults.busyButtonStyle,
    spinnerStyle: defaults.spinnerStyle,
    footerLayout: defaults.footerLayout,
    footerBackground: defaults.footerBackground,
    footerSurface: defaults.footerSurface,
    cookieSettingsButton: defaults.cookieSettingsButton,
    languageSwitcherStyle: defaults.languageSwitcherStyle,
    ...overrides,
  };
};

const clickSave = async (user: UserEvent) => {
  const saveChangesButton = await screen.findByRole('button', {
    name: SAVE_CHANGES,
  });
  await user.click(saveChangesButton);
};

const saveAndExpectLook = async (
  user: UserEvent,
  saved: Partial<TLookFormValues>,
) => {
  await clickSave(user);

  await waitFor(() => {
    expect(updateLookAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      savedLookValues(saved),
    );
  });
};

const pickAndSaveLogo = async (user: UserEvent) => {
  await pickLogo(user);
  await clickSave(user);
};

const clickRestoreChanges = async (user: UserEvent) => {
  const restoreChangesButton = screen.getByRole('button', {
    name: RESTORE_CHANGES,
  });
  await user.click(restoreChangesButton);
};

const setupAndSaveNudgedHue = async (user: UserEvent) => {
  setupLookForm();
  await nudgeAccentHue(user);
  await clickSave(user);
};

const setupArchived = (overrides: Parameters<typeof setupLookForm>[0] = {}) =>
  setupLookForm({ archivedAt: MOCK_ARCHIVED_AT, ...overrides });

const stageAssetRemoval = async (user: UserEvent) => {
  await openLookRow(user, LOOK_ROW.BRAND);
  const removeButton = screen.getByRole('button', {
    name: messages.assetUploadField.remove,
  });
  await user.click(removeButton);
};

const chooseOption = async (
  user: UserEvent,
  selectName: string,
  optionName: string,
) => {
  const select = screen.getByRole('combobox', { name: selectName });
  await user.click(select);
  const option = await screen.findByRole('option', { name: optionName });
  await user.click(option);
};

const chooseEditorial = async (user: UserEvent) => {
  const editorialRadio = screen.getByRole('radio', { name: EDITORIAL });
  await user.click(editorialRadio);
};

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(updateLookAction).mockReset();
    vi.mocked(uploadBrandAssetAction).mockReset();
    vi.mocked(clearBrandAssetAction).mockReset();
    vi.mocked(isAccentHueAccessible).mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(
    'with the default values',
    { timeout: HEAVY_FORM_TIMEOUT_MS },
    () => {
      beforeEach(() => {
        setupLookForm();
      });

      it('lists the Preset card, then the Style and Site parts rows in order', () => {
        const editPanel = screen.getByTestId(EDIT_PANEL_TEST_ID);
        const presetHeading = within(editPanel).getAllByRole('heading', {
          level: 2,
        });
        const rowHeadings = within(editPanel).getAllByRole('heading', {
          level: 3,
        });
        const presetTitles = presetHeading.map(
          (heading) => heading.textContent,
        );
        const rowTitles = rowHeadings.map((heading) => heading.textContent);

        expect(presetTitles).toEqual([LOOK_FORM.presetLabel]);
        expect(rowTitles).toEqual([
          LOOK_FORM.colourHeading,
          LOOK_FORM.brandHeading,
          LOOK_FORM.typeHeading,
          LOOK_FORM.shapeHeading,
          LOOK_FORM.buttonsHeading,
          LOOK_FORM.headerHeading,
          LOOK_FORM.footerHeading,
          LOOK_FORM.languageSwitcherLabel,
        ]);
      });

      it('switches between the Edit and Preview tabs', async () => {
        const tabList = screen.getByRole('tablist', {
          name: LOOK_FORM.viewTabsAriaLabel,
        });
        const editTab = within(tabList).getByRole('tab', { name: 'Edit' });
        const previewTab = screen.getByRole('tab', { name: 'Preview' });
        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');

        await user.click(previewTab);

        const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
        expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'false');
        expect(previewPanel).toContainElement(sampleTokens);
      });

      describe('with the Colour row open', () => {
        beforeEach(async () => {
          await openLookRow(user, LOOK_ROW.COLOUR);
        });

        it("describes each Colour control with its field's hint", () => {
          const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
          const followSwitch = screen.getByRole('switch', {
            name: FOLLOW_ACCENT_HUE,
          });

          expect(hueSlider).toHaveAccessibleDescription(
            LOOK_FORM.accentHueDescription,
          );
          expect(followSwitch).toHaveAccessibleDescription(
            LOOK_FORM.logoHueDescription,
          );
        });

        it('names the logo hue group with its optional tag', () => {
          const logoHueGroup = screen.getByRole('group', {
            name: `${LOOK_FORM.logoHueLabel} ${LOOK_FORM.optionalTag}`,
          });

          expect(logoHueGroup).toBeVisible();
        });
      });

      describe('with the Shape row open', () => {
        beforeEach(async () => {
          await openLookRow(user, LOOK_ROW.SHAPE);
        });

        it("describes the corner radius control with its field's hint", () => {
          const radiusGroup = screen.getByRole('group', {
            name: LOOK_FORM.radiusScaleLabel,
          });

          expect(radiusGroup).toHaveAccessibleDescription(
            LOOK_FORM.radiusScaleDescription,
          );
        });

        it('describes each header buttons option', () => {
          const headerButtonsGroup = screen.getByRole('group', {
            name: LOOK_FORM.headerControlStyleLabel,
          });
          const plainButton = within(headerButtonsGroup).getByRole('button', {
            name: LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
          });

          expect(plainButton).toHaveAccessibleDescription(
            LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
          );
        });

        it('previews a changed radius scale and density before saving', async () => {
          const extraLargeButton = screen.getByRole('button', {
            name: EXTRA_LARGE,
          });
          await user.click(extraLargeButton);
          const compactButton = screen.getByRole('button', { name: COMPACT });
          await user.click(compactButton);

          const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
          expect(sampleTokens).toHaveStyle({
            '--radius-md': '16px',
            '--spacing-card-x': '0.75rem',
          });
        });
      });

      it.each([
        {
          row: LOOK_ROW.SHAPE,
          group: LOOK_FORM.headerControlStyleLabel,
          option: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
          saved: { headerControlStyle: HEADER_CONTROL_STYLE.SOFT },
        },
        {
          row: LOOK_ROW.HEADER,
          group: LOOK_FORM.headerSubmenuStyleLabel,
          option: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
          saved: { headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL },
        },
        {
          row: LOOK_ROW.HEADER,
          group: LOOK_FORM.headerBarStyleLabel,
          option: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
          saved: { headerBarStyle: HEADER_BAR_STYLE.FLOATING },
        },
        {
          row: LOOK_ROW.HEADER,
          group: LOOK_FORM.accountButtonStyleLabel,
          option: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
          saved: { accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE },
        },
        {
          row: LOOK_ROW.HEADER,
          group: LOOK_FORM.accountPanelStyleLabel,
          option: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
          saved: { accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB },
        },
        {
          row: LOOK_ROW.HEADER,
          group: LOOK_FORM.accountPhonePlacementLabel,
          option: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
          saved: { accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU },
        },
        {
          row: LOOK_ROW.BUTTONS,
          group: LOOK_FORM.busyButtonStyleLabel,
          option: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
          saved: { busyButtonStyle: BUSY_BUTTON_STYLE.EDGE },
        },
        {
          row: LOOK_ROW.FOOTER,
          group: LOOK_FORM.footerBackgroundLabel,
          option: LOOK_FORM.footerBackgroundOptionLabel.SECONDARY,
          saved: { footerBackground: BRAND_VARIANT.SECONDARY },
        },
        {
          row: LOOK_ROW.FOOTER,
          group: LOOK_FORM.footerSurfaceLabel,
          option: LOOK_FORM.footerSurfaceOptionLabel.CARD,
          saved: { footerSurface: FOOTER_SURFACE.CARD },
        },
        {
          row: LOOK_ROW.FOOTER,
          group: LOOK_FORM.cookieSettingsButtonLabel,
          option: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
          saved: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
        },
        {
          row: LOOK_ROW.LANGUAGE_SWITCHER,
          group: LOOK_FORM.languageSwitcherLabel,
          option: LOOK_FORM.languageSwitcherOptionLabel.CODES,
          saved: { languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES },
        },
        {
          row: LOOK_ROW.SHAPE,
          group: LOOK_FORM.cardStyleLabel,
          option: OUTLINED,
          saved: { cardStyle: CARD_STYLE.OUTLINED },
        },
      ])(
        'saves the chosen $group style',
        async ({ row, group, option, saved }) => {
          await openLookRow(user, row);
          const [styleGroup] = screen.getAllByRole('group', { name: group });
          const optionButton = within(styleGroup!).getByRole('button', {
            name: option,
          });
          await user.click(optionButton);

          await saveAndExpectLook(user, saved);
        },
      );

      it.each([
        {
          row: LOOK_ROW.HEADER,
          select: HEADER_LAYOUT_LABEL,
          option: LOOK_FORM.headerLayoutOptionLabel.TWO_ROWS,
          saved: { headerLayout: HEADER_LAYOUT.TWO_ROWS },
        },
        {
          row: LOOK_ROW.BUTTONS,
          select: SPINNER_LABEL,
          option: LOOK_FORM.spinnerStyleOptionLabel.DOTS,
          saved: { spinnerStyle: SPINNER_STYLE.DOTS },
        },
        {
          row: LOOK_ROW.FOOTER,
          select: FOOTER_LAYOUT_LABEL,
          option: LOOK_FORM.footerLayoutOptionLabel.BIG_WORDMARK,
          saved: { footerLayout: FOOTER_LAYOUT.BIG_WORDMARK },
        },
      ])('saves the chosen $select', async ({ row, select, option, saved }) => {
        await openLookRow(user, row);
        await chooseOption(user, select, option);

        await saveAndExpectLook(user, saved);
      });

      describe('with the Header row open', () => {
        beforeEach(async () => {
          await openLookRow(user, LOOK_ROW.HEADER);
        });

        it('previews the chosen account panel open while signed in', async () => {
          const hubButton = screen.getByRole('button', {
            name: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
          });
          await user.click(hubButton);
          const signedInButton = screen.getByRole('button', {
            name: LOOK_PREVIEW.readerSignedIn,
          });
          await user.click(signedInButton);

          const fullHeader = screen.getByTestId(SAMPLE_HEADER_FULL_TEST_ID);
          const accountMenu = within(fullHeader).getByRole('menu', {
            name: LOOK_PREVIEW.accountMenuAriaLabel,
          });
          expect(accountMenu).toBeVisible();
          expect(accountMenu).toHaveTextContent(
            LOOK_PREVIEW.myBookmarksDescription,
          );
        });

        it('previews the chosen header layout and bar and footer layout', async () => {
          await chooseOption(
            user,
            HEADER_LAYOUT_LABEL,
            LOOK_FORM.headerLayoutOptionLabel.MENU_BUTTON,
          );
          const barGroup = screen.getByRole('group', {
            name: LOOK_FORM.headerBarStyleLabel,
          });
          const floatingButton = within(barGroup).getByRole('button', {
            name: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
          });
          await user.click(floatingButton);
          await openLookRow(user, LOOK_ROW.FOOTER);
          await chooseOption(
            user,
            FOOTER_LAYOUT_LABEL,
            LOOK_FORM.footerLayoutOptionLabel.CENTRED,
          );

          const sampleHeader = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
          const sampleFooter = screen.getByTestId(SAMPLE_FOOTER_TEST_ID);
          expect(sampleHeader).toHaveAttribute(
            SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
            HEADER_LAYOUT.MENU_BUTTON,
          );
          expect(sampleHeader).toHaveAttribute(
            SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
            HEADER_BAR_STYLE.FLOATING,
          );
          expect(sampleFooter).toHaveAttribute(
            'data-layout',
            FOOTER_LAYOUT.CENTRED,
          );
        });
      });

      it('shows the chosen busy style and spinner on the preview busy button', async () => {
        await openLookRow(user, LOOK_ROW.BUTTONS);
        const busyGroup = screen.getByRole('group', {
          name: LOOK_FORM.busyButtonStyleLabel,
        });
        const edgeButton = within(busyGroup).getByRole('button', {
          name: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
        });
        await user.click(edgeButton);
        await chooseOption(
          user,
          SPINNER_LABEL,
          LOOK_FORM.spinnerStyleOptionLabel.PULSE,
        );

        const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);
        expect(sample).toHaveAttribute(
          SAMPLE_BUSY_STYLE_ATTRIBUTE,
          BUSY_BUTTON_STYLE.EDGE,
        );
        expect(sample).toHaveAttribute(
          SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
          SPINNER_STYLE.PULSE,
        );
      });

      it('follows the preset spinner until one is chosen', async () => {
        const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);
        expect(sample).toHaveAttribute(
          SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
          SPINNER_STYLE.BRAILLE,
        );

        await chooseEditorial(user);

        expect(sample).toHaveAttribute(
          SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
          SPINNER_STYLE.RING,
        );
      });

      it('offers Save changes only once the form is dirty', async () => {
        const idleSaveButton = screen.queryByRole('button', {
          name: SAVE_CHANGES,
        });
        const savedNote = screen.queryByText(ALL_CHANGES_SAVED);
        expect(idleSaveButton).not.toBeInTheDocument();
        expect(savedNote).not.toBeInTheDocument();

        await nudgeAccentHue(user);

        const dirtySaveButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(dirtySaveButton).toBeEnabled();
      });

      it('leaves every Look control enabled for a non-archived tenant', async () => {
        const consolePreset = screen.getByRole('radio', { name: CONSOLE });
        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
        await openLookRow(user, LOOK_ROW.BRAND);
        const uploadLogoButton = screen.getByRole('button', {
          name: UPLOAD_LOGO,
        });
        await openLookRow(user, LOOK_ROW.SHAPE);
        const smallButton = screen.getByRole('button', {
          name: LOOK_FORM.radiusScaleOptionLabel.SM,
        });

        expect(consolePreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
        expect(hueSlider).toBeEnabled();
        expect(followSwitch).not.toHaveAttribute(ARIA_DISABLED, 'true');
        expect(uploadLogoButton).toBeEnabled();
        expect(smallButton).toBeEnabled();
      });

      describe('after nudging the accent hue', () => {
        beforeEach(async () => {
          await nudgeAccentHue(user);
        });

        it('marks only the card holding an unsaved change', () => {
          const colourHeading = screen.getByRole('heading', {
            name: `${LOOK_FORM.colourHeading}${UNSAVED_DOT}`,
          });
          const typeHeading = screen.getByRole('heading', {
            name: LOOK_FORM.typeHeading,
          });

          expect(colourHeading).toBeVisible();
          expect(typeHeading).toBeVisible();
        });

        it('discards unsaved changes back to the saved values', async () => {
          const discardButton = screen.getByRole('button', { name: DISCARD });
          await user.click(discardButton);

          const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
          const saveButton = screen.queryByRole('button', {
            name: SAVE_CHANGES,
          });
          expect(hueReadout).toBeVisible();
          expect(saveButton).not.toBeInTheDocument();
        });

        describe('and saved', () => {
          beforeEach(async () => {
            await clickSave(user);
          });

          it('saves the nudged hue with the rest of the current look', async () => {
            await waitFor(() => {
              expect(updateLookAction).toHaveBeenCalledWith(
                MOCK_TENANT_ID,
                savedLookValues({ accentHue: NUDGED_ACCENT_HUE }),
              );
            });
          });

          it('shows a save-confirmation toast once the save resolves', async () => {
            const toast = await screen.findByText(LOOK_FORM.alertSuccess);

            expect(toast).toBeVisible();
          });

          it('hides the save bar once the save resolves', async () => {
            const savedNote = await screen.findByText(ALL_CHANGES_SAVED);
            const saveButton = screen.queryByRole('button', {
              name: SAVE_CHANGES,
            });

            expect(savedNote).toBeVisible();
            expect(saveButton).not.toBeInTheDocument();
          });
        });
      });

      it('selects a preset with the arrow keys and applies it to the form', async () => {
        const consolePreset = screen.getByRole('radio', { name: CONSOLE });
        const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
        await user.click(consolePreset);
        await user.keyboard('{ArrowRight}');
        await openLookRow(user, LOOK_ROW.COLOUR);

        const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
        expect(editorialPreset).toBeChecked();
        expect(hueReadout).toBeVisible();
        expect(updateLookAction).not.toHaveBeenCalled();
      });

      describe('after choosing the Editorial preset', () => {
        beforeEach(async () => {
          await chooseEditorial(user);
          await openLookRow(user, LOOK_ROW.COLOUR);
        });

        it('marks no unsaved change on the Preset title', () => {
          const presetHeading = screen.getByRole('heading', {
            name: LOOK_FORM.presetLabel,
          });

          expect(presetHeading).toBeVisible();
        });

        it("resets the accent hue to the preset's", () => {
          const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));

          expect(hueReadout).toBeVisible();
        });

        it("previews the preset's card style", () => {
          const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

          expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
        });
      });
    },
  );

  it('resets the header buttons style with the rest of the preset', async () => {
    setupLookForm({
      initialValues: {
        ...defaultLookFormValues(),
        headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
      },
    });

    const resetToPresetButton = screen.getByRole('button', {
      name: RESET_TO_PRESET,
    });
    await user.click(resetToPresetButton);
    await openLookRow(user, LOOK_ROW.SHAPE);

    const headerButtons = screen.getByRole('group', {
      name: LOOK_FORM.headerControlStyleLabel,
    });
    const outlinedButton = within(headerButtons).getByRole('button', {
      name: LOOK_FORM.headerControlStyleOptionLabel.OUTLINED,
    });
    expect(outlinedButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  describe('after choosing a preset over a customised radius', () => {
    beforeEach(async () => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          radiusScale: RADIUS_SCALE.XL,
        },
      });
      await chooseEditorial(user);
      await openLookRow(user, LOOK_ROW.SHAPE);
    });

    it('keeps the customised radius and takes the density the owner left alone', () => {
      const extraLargeButton = screen.getByRole('button', {
        name: EXTRA_LARGE,
      });
      const compactButton = screen.getByRole('button', { name: COMPACT });

      expect(extraLargeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(compactButton).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it("puts the radius alone back to the new preset's value", async () => {
      const usePresetRadiusLink = screen.getByRole('button', {
        name: USE_PRESET_RADIUS,
      });
      await user.click(usePresetRadiusLink);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const usePresetRadiusButton = screen.queryByRole('button', {
        name: USE_PRESET_RADIUS,
      });
      expect(smallButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(usePresetRadiusButton).not.toBeInTheDocument();
    });
  });

  describe('after choosing a preset over saved non-theme settings', () => {
    beforeEach(async () => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          logo: { url: MOCK_LOGO_URL },
          headerLayout: HEADER_LAYOUT.CENTRED_BRAND,
          headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
          headerBarStyle: HEADER_BAR_STYLE.FLOATING,
          accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
          accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
          accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
          busyButtonStyle: BUSY_BUTTON_STYLE.KEPT,
          spinnerStyle: SPINNER_STYLE.DOTS,
          footerLayout: FOOTER_LAYOUT.COMPACT,
          footerBackground: BRAND_VARIANT.SECONDARY,
          footerSurface: FOOTER_SURFACE.CARD,
          cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
        },
      });
      await chooseEditorial(user);
    });

    it('keeps the saved logo', async () => {
      await openLookRow(user, LOOK_ROW.BRAND);

      const logo = screen.getByAltText(CURRENT_LOGO);

      expect(logo).toBeVisible();
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        select: HEADER_LAYOUT_LABEL,
        option: LOOK_FORM.headerLayoutOptionLabel.CENTRED_BRAND,
      },
      {
        row: LOOK_ROW.BUTTONS,
        select: SPINNER_LABEL,
        option: LOOK_FORM.spinnerStyleOptionLabel.DOTS,
      },
      {
        row: LOOK_ROW.FOOTER,
        select: FOOTER_LAYOUT_LABEL,
        option: LOOK_FORM.footerLayoutOptionLabel.COMPACT,
      },
    ])('keeps the saved $select', async ({ row, select, option }) => {
      await openLookRow(user, row);

      const selectBox = screen.getByRole('combobox', { name: select });

      expect(selectBox).toHaveTextContent(option);
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerSubmenuStyleLabel,
        option: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        option: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        option: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        option: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        option: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
      },
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.busyButtonStyleLabel,
        option: LOOK_FORM.busyButtonStyleOptionLabel.KEPT,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerBackgroundLabel,
        option: LOOK_FORM.footerBackgroundOptionLabel.SECONDARY,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerSurfaceLabel,
        option: LOOK_FORM.footerSurfaceOptionLabel.CARD,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.cookieSettingsButtonLabel,
        option: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      },
    ])('keeps the saved $group', async ({ row, group, option }) => {
      await openLookRow(user, row);

      const styleGroup = screen.getByRole('group', { name: group });
      const optionButton = within(styleGroup).getByRole('button', {
        name: option,
      });

      expect(optionButton).toHaveAttribute(ARIA_PRESSED, 'true');
    });
  });

  it.each([
    { banner: 'on', hasCookieBanner: true, isNoteShown: false },
    { banner: 'off', hasCookieBanner: false, isNoteShown: true },
  ])(
    'keeps the cookie button editable with the banner $banner, noting when off',
    async ({ hasCookieBanner, isNoteShown }) => {
      setupLookForm({ hasCookieBanner });
      await openLookRow(user, LOOK_ROW.FOOTER);

      const note = screen.queryByText(COOKIE_BANNER_OFF_NOTE);
      const cookieButtonGroup = screen.getByRole('group', {
        name: LOOK_FORM.cookieSettingsButtonLabel,
      });
      const shownButton = within(cookieButtonGroup).getByRole('button', {
        name: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      });

      expect(Boolean(note)).toBe(isNoteShown);
      expect(shownButton).toBeEnabled();
    },
  );

  it('shows a single-language note and no switcher choice with one language', async () => {
    setupLookForm({ liveLocales: [LOCALE_ISO_CODES.EN] });
    await openLookRow(user, LOOK_ROW.LANGUAGE_SWITCHER);

    const note = screen.getByText(LOOK_FORM.languageSwitcherSingleLanguage);
    const compactCodesButton = screen.queryByRole('button', {
      name: LOOK_FORM.languageSwitcherOptionLabel.CODES,
    });

    expect(note).toBeVisible();
    expect(compactCodesButton).not.toBeInTheDocument();
  });

  it('marks Save busy while the save is in flight', async () => {
    let resolveAction: (value: TUpdateLookResult) => void = () => {};
    vi.mocked(updateLookAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    await setupAndSaveNudgedHue(user);

    const saveButton = await screen.findByRole('button', { name: SAVING });
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toHaveAttribute(ARIA_DISABLED, 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
    await screen.findByText(ALL_CHANGES_SAVED);
  });

  it('shows the error alert above the form and keeps the save bar unsaved when the save fails', async () => {
    vi.mocked(updateLookAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    await setupAndSaveNudgedHue(user);

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: HEAVY_FORM_TIMEOUT_MS },
    );
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    expect(alert).toHaveTextContent(LOOK_FORM.alertError);
    expect(saveBar).not.toContainElement(alert);
    expect(saveBar).toHaveTextContent(/unsaved change/);
  });

  describe('the preview sub-menu', () => {
    let submenuGroup: HTMLElement;

    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.HEADER);
      submenuGroup = screen.getByRole('group', {
        name: LOOK_FORM.headerSubmenuStyleLabel,
      });
    });

    it('starts closed', () => {
      const submenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);

      expect(submenu).not.toBeInTheDocument();
    });

    it('opens while the Sub-menus field is hovered', async () => {
      await user.hover(submenuGroup);

      const openSubmenu = screen.getByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(openSubmenu).toHaveAttribute(
        SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
        HEADER_SUBMENU_STYLE.DROPDOWN,
      );

      await user.unhover(submenuGroup);

      const closedSubmenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(closedSubmenu).not.toBeInTheDocument();
    });

    it('shows the picked style and stays open while the field keeps focus', async () => {
      const wideButton = within(submenuGroup).getByRole('button', {
        name: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
      });
      await user.click(wideButton);
      await user.unhover(submenuGroup);

      const openSubmenu = screen.getByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(openSubmenu).toHaveAttribute(
        SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
        HEADER_SUBMENU_STYLE.WIDE_PANEL,
      );

      await user.click(document.body);

      const closedSubmenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(closedSubmenu).not.toBeInTheDocument();
    });
  });

  describe('the preview device', () => {
    const deviceButton = (
      key: 'deviceDesktop' | 'deviceTablet' | 'devicePhone',
    ) => screen.getByRole('button', { name: tDevicePreview(key) });
    const showOnDesktopButton = () =>
      screen.queryByRole('button', { name: LOOK_FORM.headerShowOnDesktop });

    describe('from lg', () => {
      beforeEach(async () => {
        stubLgUpWindow();
        setupLookForm();
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('opens on Desktop with no device note', () => {
        const desktopButton = deviceButton('deviceDesktop');
        const showOnDesktop = showOnDesktopButton();

        expect(desktopButton).toBePressed();
        expect(showOnDesktop).not.toBeInTheDocument();
      });

      it('drops the tab panels, where the view tabs are hidden', () => {
        const tabPanel = screen.queryByRole('tabpanel');

        expect(tabPanel).not.toBeInTheDocument();
      });
    });

    describe('below lg', () => {
      beforeEach(async () => {
        setupLookForm();
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('opens on Phone with the phone note under the header layout', () => {
        const note = screen.getByText(LOOK_FORM.headerPreviewDeviceNote.PHONE);
        const phoneButton = deviceButton('devicePhone');
        const showOnDesktop = showOnDesktopButton();

        expect(phoneButton).toBePressed();
        expect(note).toBeVisible();
        expect(showOnDesktop).toBeVisible();
      });

      it('shows the tablet note when the preview is on Tablet', async () => {
        const tabletButton = deviceButton('deviceTablet');
        await user.click(tabletButton);

        const note = screen.getByText(LOOK_FORM.headerPreviewDeviceNote.TABLET);
        expect(note).toBeVisible();
      });

      it('switches the preview to Desktop from the header note', async () => {
        const showOnDesktop = screen.getByRole('button', {
          name: LOOK_FORM.headerShowOnDesktop,
        });
        await user.click(showOnDesktop);

        const note = screen.queryByText(
          LOOK_FORM.headerPreviewDeviceNote.PHONE,
        );
        const desktopButton = deviceButton('deviceDesktop');
        const showOnDesktopAfter = showOnDesktopButton();
        expect(desktopButton).toBePressed();
        expect(note).not.toBeInTheDocument();
        expect(showOnDesktopAfter).not.toBeInTheDocument();
      });

      it('keeps the device and reader state across the Edit and Preview tabs', async () => {
        const tabletButton = deviceButton('deviceTablet');
        const signedInButton = screen.getByRole('button', {
          name: LOOK_PREVIEW.readerSignedIn,
        });
        await user.click(tabletButton);
        await user.click(signedInButton);

        const previewTab = screen.getByRole('tab', { name: 'Preview' });
        const editTab = screen.getByRole('tab', { name: 'Edit' });
        await user.click(previewTab);
        await user.click(editTab);

        expect(tabletButton).toBePressed();
        expect(signedInButton).toBePressed();
      });
    });
  });

  describe('when the accent hue is rejected', () => {
    beforeEach(async () => {
      vi.mocked(isAccentHueAccessible).mockImplementation(
        (hue) => hue !== NUDGED_ACCENT_HUE,
      );
      setupLookForm();
      await nudgeAccentHue(user);
      await user.tab();
    });

    it('explains the rejection on the slider and flags one field', () => {
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      const attentionNote = screen.getByText(ONE_FIELD_NEEDS_ATTENTION);

      expect(slider).toHaveAccessibleDescription(
        REJECTED_ACCENT_HUE_DESCRIPTION,
      );
      expect(attentionNote).toBeVisible();
    });

    it('does not save while the hue is rejected', async () => {
      await clickSave(user);

      expect(updateLookAction).not.toHaveBeenCalled();
    });

    it('focuses the accent hue slider from the save bar', async () => {
      await clickGoToTheFirstOne(user);

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(slider).toHaveFocus();
    });

    it('returns to the Edit tab to focus the accent hue slider from the Preview', async () => {
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      await user.click(previewTab);
      await clickGoToTheFirstOne(user);

      const editTab = screen.getByRole('tab', { name: 'Edit' });
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('with a saved accent hue off the preset', () => {
    beforeEach(() => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          accentHue: MOCK_SAVED_ACCENT_HUE,
        },
      });
    });

    it('offers Reset to preset with no unsaved edits, hiding it once matched', async () => {
      const unsavedRegion = screen.queryByRole('region', {
        name: UNSAVED_CHANGES,
      });
      expect(unsavedRegion).not.toBeInTheDocument();

      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);
      await openLookRow(user, LOOK_ROW.COLOUR);

      const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      const resetButton = screen.queryByRole('button', {
        name: RESET_TO_PRESET,
      });
      expect(hueReadout).toBeVisible();
      expect(resetButton).not.toBeInTheDocument();
    });

    it('resets to the preset in the draft only, so Discard restores the saved look', async () => {
      await openLookRow(user, LOOK_ROW.SHAPE);
      const compactButton = screen.getByRole('button', { name: COMPACT });
      await user.click(compactButton);
      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);
      await openLookRow(user, LOOK_ROW.COLOUR);

      const resetReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      expect(resetReadout).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();

      const discardButton = screen.getByRole('button', { name: DISCARD });
      await user.click(discardButton);

      const savedReadout = screen.getByText(hueValue(MOCK_SAVED_ACCENT_HUE));
      expect(savedReadout).toBeVisible();
    });
  });

  it('offers no Reset to preset on Free, even with an accent hue off the preset', () => {
    setupLookForm({
      plan: TENANT_PLAN.FREE,
      initialValues: {
        ...defaultLookFormValues(),
        accentHue: MOCK_SAVED_ACCENT_HUE,
      },
    });

    const resetButton = screen.queryByRole('button', {
      name: RESET_TO_PRESET,
    });
    const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
    expect(resetButton).not.toBeInTheDocument();
    expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });

    it('locks every Growth-only field with the Growth plan badge', async () => {
      const locks = screen.getAllByText(GROWTH_PLAN);
      await openLookRow(user, LOOK_ROW.COLOUR);
      const followSwitch = screen.getByRole('switch', {
        name: FOLLOW_ACCENT_HUE,
      });
      await openLookRow(user, LOOK_ROW.TYPE);
      const headingFont = screen.getByRole('combobox', {
        name: LOOK_FORM.headingFontLabel,
      });
      await openLookRow(user, LOOK_ROW.SHAPE);
      const extraLargeButton = screen.getByRole('button', {
        name: EXTRA_LARGE,
      });
      await openLookRow(user, LOOK_ROW.LANGUAGE_SWITCHER);
      const codesButton = screen.getByRole('button', {
        name: LOOK_FORM.languageSwitcherOptionLabel.CODES,
      });

      expect(locks).toHaveLength(GROWTH_ONLY_FIELD_COUNT);
      expect(headingFont).toHaveAttribute(DATA_DISABLED);
      expect(headingFont).toHaveAccessibleDescription(GROWTH_PLAN);
      expect(extraLargeButton).toBeDisabled();
      expect(followSwitch).toBeDisabled();
      expect(codesButton).toBeDisabled();
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        select: HEADER_LAYOUT_LABEL,
        current: LOOK_FORM.headerLayoutOptionLabel.CLASSIC,
        hint: LOOK_FORM.headerLayoutDescription,
      },
      {
        row: LOOK_ROW.BUTTONS,
        select: SPINNER_LABEL,
        current: LOOK_FORM.spinnerStyleOptionLabel.PRESET,
        hint: LOOK_FORM.spinnerStyleDescription,
      },
      {
        row: LOOK_ROW.FOOTER,
        select: FOOTER_LAYOUT_LABEL,
        current: LOOK_FORM.footerLayoutOptionLabel.COLUMNS,
        hint: LOOK_FORM.footerLayoutDescription,
      },
    ])(
      'shows $select locked at its default',
      async ({ row, select, current, hint }) => {
        await openLookRow(user, row);
        const selectBox = screen.getByRole('combobox', { name: select });

        expect(selectBox).toHaveAttribute(DATA_DISABLED);
        expect(selectBox).toHaveTextContent(current);
        expect(selectBox).toHaveAccessibleDescription(`${GROWTH_PLAN} ${hint}`);
      },
    );

    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        current: LOOK_FORM.headerBarStyleOptionLabel.FULL_WIDTH,
        other: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        current: LOOK_FORM.accountButtonStyleOptionLabel.PILL,
        other: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        current: LOOK_FORM.accountPanelStyleOptionLabel.CARD,
        other: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        current: LOOK_FORM.accountPhonePlacementOptionLabel.BAR,
        other: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
      },
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.busyButtonStyleLabel,
        current: LOOK_FORM.busyButtonStyleOptionLabel.LABEL,
        other: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerBackgroundLabel,
        current: LOOK_FORM.footerBackgroundOptionLabel.BRAND_PRIMARY,
        other: LOOK_FORM.footerBackgroundOptionLabel.SECONDARY,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerSurfaceLabel,
        current: LOOK_FORM.footerSurfaceOptionLabel.FULL_WIDTH,
        other: LOOK_FORM.footerSurfaceOptionLabel.CARD,
      },
    ])(
      'shows $group locked at its default',
      async ({ row, group, current, other }) => {
        await openLookRow(user, row);
        const styleGroup = screen.getByRole('group', { name: group });
        const currentButton = within(styleGroup).getByRole('button', {
          name: current,
        });
        const otherButton = within(styleGroup).getByRole('button', {
          name: other,
        });

        expect(currentButton).toHaveAttribute(ARIA_PRESSED, 'true');
        expect(otherButton).toBeDisabled();
      },
    );

    it('saves the cookie settings button, the one footer field Free keeps', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);
      const cookieButtonGroup = screen.getByRole('group', {
        name: LOOK_FORM.cookieSettingsButtonLabel,
      });
      const shownButton = within(cookieButtonGroup).getByRole('button', {
        name: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      });
      await user.click(shownButton);

      await saveAndExpectLook(user, {
        cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
      });
    });

    it('keeps the preset, accent hue and brand images editable', async () => {
      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      await openLookRow(user, LOOK_ROW.COLOUR);
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      await openLookRow(user, LOOK_ROW.BRAND);
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });

      expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hueSlider).toBeEnabled();
      expect(uploadLogoButton).toBeEnabled();
    });

    it("previews a new preset's own fonts and corners", async () => {
      await chooseEditorial(user);
      await openLookRow(user, LOOK_ROW.SHAPE);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
      expect(smallButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(sampleTokens).toHaveStyle({ '--radius-md': '4px' });
    });
  });

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(() => {
        setupArchived();
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('disables every Look control', async () => {
        const consolePreset = screen.getByRole('radio', { name: CONSOLE });
        const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
        await openLookRow(user, LOOK_ROW.BRAND);
        const uploadLogoButton = screen.getByRole('button', {
          name: UPLOAD_LOGO,
        });
        const uploadFaviconButton = screen.getByRole('button', {
          name: UPLOAD_FAVICON,
        });

        expect(consolePreset).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(editorialPreset).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(hueSlider).toBeDisabled();
        expect(followSwitch).toBeDisabled();
        expect(uploadLogoButton).toBeDisabled();
        expect(uploadFaviconButton).toBeDisabled();
      });

      it('disables the Header controls', async () => {
        await openLookRow(user, LOOK_ROW.HEADER);
        const layoutSelect = screen.getByRole('combobox', {
          name: HEADER_LAYOUT_LABEL,
        });
        const dropdownButton = screen.getByRole('button', {
          name: LOOK_FORM.headerSubmenuStyleOptionLabel.DROPDOWN,
        });
        const floatingButton = screen.getByRole('button', {
          name: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
        });

        expect(layoutSelect).toHaveAttribute(DATA_DISABLED);
        expect(layoutSelect).toHaveAccessibleDescription(
          `${ARCHIVED_NOTICE_DESCRIPTION} ${LOOK_FORM.headerLayoutDescription}`,
        );
        expect(dropdownButton).toBeDisabled();
        expect(floatingButton).toBeDisabled();
      });

      it('disables the Type and Shape controls', async () => {
        await openLookRow(user, LOOK_ROW.TYPE);
        const headingFont = screen.getByRole('combobox', {
          name: LOOK_FORM.headingFontLabel,
        });
        const bodyFont = screen.getByRole('combobox', {
          name: LOOK_FORM.bodyFontLabel,
        });
        await openLookRow(user, LOOK_ROW.SHAPE);
        const smallButton = screen.getByRole('button', {
          name: LOOK_FORM.radiusScaleOptionLabel.SM,
        });
        const extraLargeButton = screen.getByRole('button', {
          name: EXTRA_LARGE,
        });
        const compactButton = screen.getByRole('button', { name: COMPACT });
        const cardStyleGroup = screen.getByRole('group', {
          name: LOOK_FORM.cardStyleLabel,
        });
        const outlinedCardButton = within(cardStyleGroup).getByRole('button', {
          name: OUTLINED,
        });
        const softButton = screen.getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
        });

        expect(headingFont).toHaveAttribute(DATA_DISABLED);
        expect(bodyFont).toHaveAccessibleDescription(
          ARCHIVED_NOTICE_DESCRIPTION,
        );
        expect(smallButton).toBeDisabled();
        expect(extraLargeButton).toBeDisabled();
        expect(compactButton).toBeDisabled();
        expect(outlinedCardButton).toBeDisabled();
        expect(softButton).toBeDisabled();
      });
    });

    it('describes a rejected accent hue with both the archived notice and the error', async () => {
      vi.mocked(isAccentHueAccessible).mockReturnValue(false);
      setupArchived();
      await openLookRow(user, LOOK_ROW.COLOUR);

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });

      expect(slider).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${REJECTED_ACCENT_HUE_DESCRIPTION}`,
      );
    });

    it('disables Reset to preset and describes it with the archived notice', () => {
      setupArchived({
        initialValues: {
          ...defaultLookFormValues(),
          accentHue: MOCK_SAVED_ACCENT_HUE,
        },
      });

      const resetButton = screen.getByRole('button', { name: RESET_TO_PRESET });

      expect(resetButton).toBeDisabled();
      expect(resetButton).toHaveAccessibleDescription(
        ARCHIVED_NOTICE_DESCRIPTION,
      );
    });
  });

  it('restores unsaved changes after leaving, keeping the current brand images', async () => {
    const { unmount } = setupLookForm();
    await chooseEditorial(user);
    unmount();

    setupWithSavedLogo();
    await clickRestoreChanges(user);

    const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
    await openLookRow(user, LOOK_ROW.COLOUR);
    const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
    expect(editorialPreset).toBeChecked();
    expect(hueReadout).toBeVisible();

    await openLookRow(user, LOOK_ROW.BRAND);
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toBeVisible();
  });

  it('drops a draft saved before the header buttons style existed', async () => {
    const olderValues = Object.fromEntries(
      Object.entries(defaultLookFormValues()).filter(
        ([key]) => key !== 'headerControlStyle',
      ),
    );
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'look' }),
      {
        values: { ...olderValues, accentHue: MOCK_SAVED_ACCENT_HUE },
        baseline: olderValues,
        takenAt: MOCK_DRAFT_TAKEN_AT,
      },
    );
    setupLookForm();
    await openLookRow(user, LOOK_ROW.COLOUR);

    const restoreButton = screen.queryByRole('button', { name: /^Restore/ });
    const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
    expect(restoreButton).not.toBeInTheDocument();
    expect(hueReadout).toBeVisible();
  });

  describe('brand images', () => {
    describe('with a picked logo', () => {
      beforeEach(async () => {
        setupLookForm();
        await pickLogo(user);
      });

      it('stages a picked logo as an unsaved change without uploading it', () => {
        const brandHeading = screen.getByRole('heading', {
          name: `${LOOK_FORM.brandHeading}${UNSAVED_DOT}`,
        });
        const logo = screen.getByAltText(CURRENT_LOGO);

        expect(brandHeading).toBeVisible();
        expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
        expect(uploadBrandAssetAction).not.toHaveBeenCalled();
      });

      it('uploads a staged logo on Save, then saves the rest of the look', async () => {
        await clickSave(user);

        const savedNote = await screen.findByText(ALL_CHANGES_SAVED);
        const logo = screen.getByAltText(CURRENT_LOGO);
        const [uploadCall] = vi.mocked(uploadBrandAssetAction).mock.calls;
        const [uploadTenantId, uploadKind, uploadForm] = uploadCall ?? [];
        expect(savedNote).toBeVisible();
        expect(uploadBrandAssetAction).toHaveBeenCalledTimes(1);
        expect(uploadTenantId).toBe(MOCK_TENANT_ID);
        expect(uploadKind).toBe('logo');
        expect(uploadForm).toBeInstanceOf(FormData);
        expect(updateLookAction).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          savedLookValues(),
        );
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(MOCK_UPLOADED_LOGO_URL),
        );
      });
    });

    describe('while the logo upload is pending', () => {
      let resolveUpload: (value: TUploadResult) => void = () => {};

      beforeEach(async () => {
        vi.mocked(uploadBrandAssetAction).mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveUpload = resolve;
            }),
        );
        setupLookForm();
        await pickAndSaveLogo(user);
      });

      const resolveUploadSuccessfully = () => {
        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: MOCK_UPLOADED_LOGO_URL,
        });
      };

      it('locks the edit panel while a save is running', async () => {
        const lockedPanel = await screen.findByTestId(EDIT_PANEL_TEST_ID);
        expect(lockedPanel).toHaveAttribute('inert');

        resolveUploadSuccessfully();

        await waitFor(() => {
          const editPanel = screen.getByTestId(EDIT_PANEL_TEST_ID);
          expect(editPanel).not.toHaveAttribute('inert');
        });
      });

      it('keeps an edit made while the logo uploads as an unsaved change', async () => {
        await screen.findByRole('button', { name: SAVING });
        await nudgeAccentHue(user);
        resolveUploadSuccessfully();

        await waitFor(() => {
          const unsavedRegion = screen.getByRole('region', {
            name: UNSAVED_CHANGES,
          });
          expect(unsavedRegion).toHaveTextContent(
            tSaveBar('unsavedChanges', { count: 1 }),
          );
        });
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        const logo = screen.getByAltText(CURRENT_LOGO);
        expect(hueReadout).toBeVisible();
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(MOCK_UPLOADED_LOGO_URL),
        );
      });
    });

    describe('with a saved logo', () => {
      beforeEach(() => {
        setupWithSavedLogo();
      });

      it('clears a staged removal on Save', async () => {
        await stageAssetRemoval(user);
        expect(clearBrandAssetAction).not.toHaveBeenCalled();

        await clickSave(user);

        await waitFor(() => {
          expect(clearBrandAssetAction).toHaveBeenCalledWith(
            MOCK_TENANT_ID,
            'logo',
          );
        });
      });

      it('drops a staged logo on Discard, keeping the saved one', async () => {
        await pickLogo(user);
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);

        const logo = screen.getByAltText(CURRENT_LOGO);
        const savedNote = screen.queryByText(ALL_CHANGES_SAVED);
        expect(logo).toHaveAttribute('src', optimizedImageSrc(MOCK_LOGO_URL));
        expect(savedNote).not.toBeInTheDocument();
        expect(uploadBrandAssetAction).not.toHaveBeenCalled();
      });
    });

    describe('when the upload fails', () => {
      beforeEach(() => {
        vi.mocked(uploadBrandAssetAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });
        setupLookForm();
      });

      it('fails the save on the logo picker and keeps the draft', async () => {
        await nudgeAccentHue(user);
        await pickAndSaveLogo(user);

        const replaceLogoButton = await screen.findByRole('button', {
          name: REPLACE_LOGO,
        });
        await waitFor(() => {
          expect(replaceLogoButton).toHaveFocus();
        });
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(replaceLogoButton).toHaveAccessibleDescription(
          `${BRAND_IMAGES_HINT} ${LOGO_UPLOAD_FAILED}`,
        );
        expect(saveButton).toBeEnabled();
        expect(updateLookAction).not.toHaveBeenCalled();

        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        expect(hueReadout).toBeVisible();
      });

      describe('after saving a picked logo', () => {
        beforeEach(async () => {
          await pickAndSaveLogo(user);
        });

        it('says Not saved beside Save and links to the failed picker', async () => {
          const saveBar = await screen.findByRole('region', {
            name: UNSAVED_CHANGES,
          });
          await waitFor(() => {
            expect(saveBar).toHaveTextContent(tSaveBar('notSaved'));
          });
          const alert = screen.queryByRole('alert');
          expect(saveBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
          expect(alert).not.toBeInTheDocument();

          await clickGoToTheFirstOne(user);

          const replaceLogoButton = screen.getByRole('button', {
            name: REPLACE_LOGO,
          });
          expect(replaceLogoButton).toHaveFocus();
        });

        it('clears the picker error once a new logo is picked', async () => {
          await screen.findByText(LOGO_UPLOAD_FAILED);
          await pickLogo(user);

          const error = screen.queryByText(LOGO_UPLOAD_FAILED);
          const attentionLink = screen.queryByRole('link', {
            name: GO_TO_THE_FIRST_ONE,
          });
          expect(error).not.toBeInTheDocument();
          expect(attentionLink).not.toBeInTheDocument();
        });
      });
    });

    it('fails the save with the refusal message when the upload is refused', async () => {
      vi.mocked(uploadBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: MOCK_UPLOAD_LIMIT },
      });
      setupLookForm();

      await pickAndSaveLogo(user);

      const error = await screen.findByText(
        tUploadErrors('fileTooLarge', { limit: MOCK_UPLOAD_LIMIT }),
      );
      expect(error).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();
    });

    it('fails the save with the remove message when clearing the favicon fails', async () => {
      vi.mocked(clearBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          favicon: { url: MOCK_LOGO_URL },
        },
      });

      await stageAssetRemoval(user);
      await clickSave(user);

      const uploadFaviconButton = await screen.findByRole('button', {
        name: UPLOAD_FAVICON,
      });
      await waitFor(() => {
        expect(uploadFaviconButton).toHaveFocus();
      });
      expect(uploadFaviconButton).toHaveAccessibleDescription(
        `${BRAND_IMAGES_HINT} ${FAVICON_REMOVE_FAILED}`,
      );
    });

    it('restores a draft without its staged logo and asks to pick it again', async () => {
      const { unmount } = setupLookForm();
      await chooseEditorial(user);
      await pickLogo(user);
      unmount();

      setupLookForm();
      await clickRestoreChanges(user);
      await openLookRow(user, LOOK_ROW.BRAND);

      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });
      const repickNote = screen.getByText(
        messages.brandAssetField.logo.pickAgain,
      );
      expect(editorialPreset).toBeChecked();
      expect(uploadLogoButton).toBeVisible();
      expect(repickNote).toBeVisible();
    });
  });
});
