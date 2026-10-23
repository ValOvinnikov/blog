import {
  ACTION_OUTCOME,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import type { TUpdateLookResult } from '@platform/server/site-config/update-look-action';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_DESCRIPTION,
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  REPLACE_LOGO,
  UPLOAD_LOGO,
} from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_NAME,
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

const {
  updateLookActionMock,
  uploadBrandAssetActionMock,
  clearBrandAssetActionMock,
} = vi.hoisted(() => ({
  updateLookActionMock: vi.fn(),
  uploadBrandAssetActionMock: vi.fn(),
  clearBrandAssetActionMock: vi.fn(),
}));

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(),
}));

vi.mock('@platform/server/site-config/update-look-action', () => ({
  updateLookAction: updateLookActionMock,
}));

vi.mock('@platform/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: uploadBrandAssetActionMock,
}));

vi.mock('@platform/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: clearBrandAssetActionMock,
}));

const isAccentHueAccessibleMock = vi.mocked(isAccentHueAccessible);

const ACCENT_HUE_HINT =
  'Colours links, buttons and highlights across your site.';
const ACCENT_HUE_REJECTED =
  "This hue doesn't keep body text readable on its tinted surfaces, so the site would replace it. Choose another hue.";
const REJECTED_ACCENT_HUE_DESCRIPTION = `${ACCENT_HUE_HINT} ${ACCENT_HUE_REJECTED}`;
const BRAND_IMAGES_HINT =
  'Logo: PNG, JPEG, WebP or SVG. Favicon: a square image.';
const UPLOADED_LOGO_URL =
  'https://example.blob.vercel-storage.com/logo-new.png';
const LOGO_FILE = new File(['bytes'], 'logo.png', { type: 'image/png' });

const HEAVY_FORM_TIMEOUT_MS = 15_000;
const DEFAULT_VALUES_CONTEXT = 'with the default values';
const ACCENT_HUE = 'Accent hue';
const ARROW_RIGHT_KEY = '{ArrowRight}';
const ARIA_SELECTED = 'aria-selected';
const SAMPLE_TOKENS_TEST_ID = 'look-sample-tokens';
const FOLLOW_ACCENT_HUE = 'Follow accent hue';
const UPLOAD_FAVICON = 'Upload favicon';
const COMPACT_CODES = 'Compact codes';
const RESET_TO_PRESET = 'Reset to preset';
const EXTRA_LARGE = 'Extra large';
const CARD_STYLE_LABEL = 'Card style';
const ARIA_DISABLED = 'aria-disabled';
const EDIT_PANEL_TEST_ID = 'look-form-edit-panel';
const FAVICON_REMOVE_FAILED = "Couldn't remove the favicon — try again.";
const LOGO_UPLOAD_FAILED = "Couldn't upload the logo — try again.";

const pickLogo = async (user: UserEvent) => {
  const [logoInput] = screen.getAllByTestId('asset-upload-field-input');
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
};

const setup = customRender(LookForm, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
  initialValues: defaultLookFormValues(),
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
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
    languageSwitcherStyle: defaults.languageSwitcherStyle,
    ...overrides,
  };
};

const setupWithSavedLogo = () =>
  setup({
    initialValues: { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } },
  });

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    updateLookActionMock.mockReset();
    updateLookActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    isAccentHueAccessibleMock.mockReset();
    isAccentHueAccessibleMock.mockReturnValue(true);
    uploadBrandAssetActionMock.mockReset();
    uploadBrandAssetActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: UPLOADED_LOGO_URL,
    });
    clearBrandAssetActionMock.mockReset();
    clearBrandAssetActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(DEFAULT_VALUES_CONTEXT, () => {
    beforeEach(() => {
      setup();
    });

    it(
      'renders the current preset and accent hue from the given initial values',
      { timeout: HEAVY_FORM_TIMEOUT_MS },
      () => {
        const consolePreset = screen.getByRole('radio', { name: 'Console' });
        const hueReadout = screen.getByText('hue 250°');

        expect(consolePreset).toHaveAttribute('aria-checked', 'true');
        expect(hueReadout).toBeVisible();
      },
    );

    it('groups the settings into six titled cards', () => {
      for (const name of [
        'Preset',
        'Colour',
        'Type',
        'Shape',
        'Brand',
        'Language switcher',
      ]) {
        const cardHeading = screen.getByRole('heading', { level: 2, name });
        expect(cardHeading).toBeVisible();
      }
    });

    it('switches between the Edit and Preview tabs', async () => {
      const tabList = screen.getByRole('tablist', { name: 'Edit or preview' });
      const editTab = within(tabList).getByRole('tab', { name: 'Edit' });
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');

      await user.click(previewTab);

      expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'false');
      const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
      const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
      expect(previewPanel).toContainElement(sampleTokens);
    });

    it("describes each Look control with its field's hint", () => {
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      const followSwitch = screen.getByRole('switch', {
        name: FOLLOW_ACCENT_HUE,
      });
      const radiusGroup = screen.getByRole('group', { name: 'Radius scale' });

      expect(hueSlider).toHaveAccessibleDescription(/Colours links/);
      expect(followSwitch).toHaveAccessibleDescription(/Tints your wordmark/);
      expect(radiusGroup).toHaveAccessibleDescription(
        'Corner roundness across every surface.',
      );
    });

    it('names the logo hue group with its optional tag', () => {
      const logoHueGroup = screen.getByRole('group', {
        name: 'Logo hue optional',
      });
      expect(logoHueGroup).toBeVisible();
    });

    it('describes both brand uploads with one shared hint', () => {
      const hint = BRAND_IMAGES_HINT;
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });
      const uploadFaviconButton = screen.getByRole('button', {
        name: UPLOAD_FAVICON,
      });

      expect(uploadLogoButton).toHaveAccessibleDescription(hint);
      expect(uploadFaviconButton).toHaveAccessibleDescription(hint);
    });

    it('saves the chosen header buttons style and marks Shape unsaved', async () => {
      const softButton = screen.getByRole('button', { name: 'Soft' });
      await user.click(softButton);

      const shapeHeading = screen.getByRole('heading', {
        name: 'Shape Unsaved',
      });
      expect(shapeHeading).toBeVisible();

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          savedLookValues({ headerControlStyle: HEADER_CONTROL_STYLE.SOFT }),
        );
      });
    });

    it('describes each header buttons option', () => {
      const plainButton = screen.getByRole('button', { name: 'Plain' });
      expect(plainButton).toHaveAccessibleDescription(
        'No outline until hovered',
      );
    });

    it('saves the chosen language switcher style', async () => {
      const compactCodesButton = screen.getByRole('button', {
        name: COMPACT_CODES,
      });
      await user.click(compactCodesButton);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          savedLookValues({
            languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
          }),
        );
      });
    });

    it('offers Save changes only once the form is dirty', async () => {
      const idleSaveButton = screen.queryByRole('button', {
        name: SAVE_CHANGES,
      });
      const savedNote = screen.queryByText(ALL_CHANGES_SAVED);
      expect(idleSaveButton).not.toBeInTheDocument();
      expect(savedNote).not.toBeInTheDocument();

      const accentHueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      accentHueSlider.focus();
      await user.keyboard(ARROW_RIGHT_KEY);

      const dirtySaveButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(dirtySaveButton).toBeEnabled();
    });

    it('hides Reset to preset while every preset-controlled value matches the preset', () => {
      const resetButton = screen.queryByRole('button', {
        name: RESET_TO_PRESET,
      });
      expect(resetButton).not.toBeInTheDocument();
    });

    it('previews a changed radius scale and density before saving', async () => {
      const extraLargeButton = screen.getByRole('button', {
        name: EXTRA_LARGE,
      });
      await user.click(extraLargeButton);
      const compactButton = screen.getByRole('button', { name: 'Compact' });
      await user.click(compactButton);

      const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
      expect(sampleTokens).toHaveStyle({
        '--radius-md': '12px',
        '--spacing-card-x': '0.75rem',
      });
    });

    it('previews and saves the outlined card style', async () => {
      const cardStyleLabelGroup = screen.getByRole('group', {
        name: CARD_STYLE_LABEL,
      });
      const outlinedButton = within(cardStyleLabelGroup).getByRole('button', {
        name: 'Outlined',
      });
      await user.click(outlinedButton);

      const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
      expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          savedLookValues({ cardStyle: CARD_STYLE.OUTLINED }),
        );
      });
    });

    it('leaves every Look control enabled for a non-archived tenant', () => {
      const consolePreset = screen.getByRole('radio', { name: 'Console' });
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      const followSwitch = screen.getByRole('switch', {
        name: FOLLOW_ACCENT_HUE,
      });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });
      const smallButton = screen.getByRole('button', { name: 'Small' });

      expect(consolePreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hueSlider).toBeEnabled();
      expect(followSwitch).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(uploadLogoButton).toBeEnabled();
      expect(smallButton).toBeEnabled();
    });

    describe('after nudging the accent hue', () => {
      beforeEach(async () => {
        const accentHueSlider = screen.getByRole('slider', {
          name: ACCENT_HUE,
        });
        accentHueSlider.focus();
        await user.keyboard(ARROW_RIGHT_KEY);
      });

      it('marks only the card holding an unsaved change', () => {
        const colourHeading = screen.getByRole('heading', {
          name: 'Colour Unsaved',
        });
        const typeHeading = screen.getByRole('heading', { name: 'Type' });
        expect(colourHeading).toBeVisible();
        expect(typeHeading).toBeVisible();
      });

      it('discards unsaved changes back to the saved values', async () => {
        const discardButton = screen.getByRole('button', { name: 'Discard' });
        await user.click(discardButton);

        const hueReadout = screen.getByText('hue 250°');
        const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
        expect(hueReadout).toBeVisible();
        expect(saveButton).not.toBeInTheDocument();
      });

      it('resets a diverged control back to the current preset on "Reset to preset"', async () => {
        const changedReadout = screen.getByText('hue 251°');
        expect(changedReadout).toBeVisible();

        const resetToPresetButton = screen.getByRole('button', {
          name: RESET_TO_PRESET,
        });
        await user.click(resetToPresetButton);

        const resetReadout = screen.getByText('hue 250°');
        expect(resetReadout).toBeVisible();
      });

      describe('and saved', () => {
        beforeEach(async () => {
          const saveChangesButton = screen.getByRole('button', {
            name: SAVE_CHANGES,
          });
          await user.click(saveChangesButton);
        });

        it('saves the current form state through updateLookAction', async () => {
          await waitFor(() => {
            expect(updateLookActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
              preset: PRESET_ID.CONSOLE,
              accentHue: 251,
              logoHue: null,
              headingFont: FONT_CHOICE.SPACE_GROTESK,
              bodyFont: FONT_CHOICE.NEWSREADER,
              radiusScale: RADIUS_SCALE.MD,
              density: DENSITY.DEFAULT,
              cardStyle: CARD_STYLE.ACCENT_BAR,
              headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
              languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
            });
          });
        });

        it('shows a save-confirmation toast once the save resolves', async () => {
          const toast = await screen.findByText('Look saved.');
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

    describe('after choosing the Editorial preset', () => {
      beforeEach(async () => {
        const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
        await user.click(editorialRadio);
      });

      it("choosing a preset resets every one of that preset's defaults", () => {
        const hueReadout = screen.getByText('hue 28°');
        expect(hueReadout).toBeVisible();
      });

      it("choosing a preset applies that preset's card style", () => {
        const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
        expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
      });
    });
  });

  it('drops the tab panels on desktop, where the view tabs are hidden', () => {
    const stubMatchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      ...stubMatchMedia(query),
      matches: true,
    }));
    setup();

    const tabPanel = screen.queryByRole('tabpanel');
    expect(tabPanel).not.toBeInTheDocument();
  });

  it("choosing a preset doesn't clear an already-saved brand image", async () => {
    setupWithSavedLogo();

    const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
    await user.click(editorialRadio);

    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toBeVisible();
  });

  it('resets the header buttons style with the rest of the preset', async () => {
    setup({
      initialValues: {
        ...defaultLookFormValues(),
        headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
      },
    });

    const resetToPresetButton = screen.getByRole('button', {
      name: RESET_TO_PRESET,
    });
    await user.click(resetToPresetButton);

    const headerButtons = screen.getByRole('group', { name: 'Header buttons' });
    const outlinedButton = within(headerButtons).getByRole('button', {
      name: 'Outlined',
    });
    expect(outlinedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a note instead of the language switcher choice with one live language', () => {
    setup({ liveLocales: [LOCALE_ISO_CODES.EN] });

    const note = screen.getByText(
      'Add another language in Languages settings to choose a style.',
    );
    const compactCodesButton = screen.queryByRole('button', {
      name: COMPACT_CODES,
    });
    expect(note).toBeVisible();
    expect(compactCodesButton).not.toBeInTheDocument();
  });

  it('marks Save busy while the save is in flight', async () => {
    let resolveAction: (value: TUpdateLookResult) => void = () => {};
    updateLookActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    setup();

    const accentHueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
    accentHueSlider.focus();
    await user.keyboard(ARROW_RIGHT_KEY);
    const saveChangesButton = screen.getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveChangesButton);

    const saveButton = await screen.findByRole('button', { name: 'Saving…' });
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toBeDisabled();

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('shows an error alert when the save fails', async () => {
    updateLookActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    const accentHueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
    accentHueSlider.focus();
    await user.keyboard(ARROW_RIGHT_KEY);
    const saveChangesButton = screen.getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveChangesButton);

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: HEAVY_FORM_TIMEOUT_MS },
    );
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    expect(alert).toHaveTextContent("Couldn't save Look settings");
    expect(saveBar).toContainElement(alert);
  });

  it('rejects an accent hue the site would replace, with a message, and blocks Save', async () => {
    isAccentHueAccessibleMock.mockImplementation((hue) => hue !== 251);
    setup();

    const slider = screen.getByRole('slider', { name: ACCENT_HUE });
    slider.focus();
    await user.keyboard(ARROW_RIGHT_KEY);

    expect(slider).toHaveAccessibleDescription(REJECTED_ACCENT_HUE_DESCRIPTION);
    const attentionNote = screen.getByText(ONE_FIELD_NEEDS_ATTENTION);
    expect(attentionNote).toBeVisible();

    const saveChangesButton = screen.getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveChangesButton);

    expect(updateLookActionMock).not.toHaveBeenCalled();
  });

  describe('when the accent hue is rejected', () => {
    const goToFirstField = async () => {
      const goToFirstOneLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(goToFirstOneLink);
    };

    beforeEach(async () => {
      isAccentHueAccessibleMock.mockImplementation((hue) => hue !== 251);
      setup();
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      slider.focus();
      await user.keyboard(ARROW_RIGHT_KEY);
      slider.blur();
    });

    it('focuses the accent hue slider from the save bar', async () => {
      await goToFirstField();

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(slider).toHaveFocus();
    });

    it('returns to the Edit tab and focuses the accent hue slider from the Preview', async () => {
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      await user.click(previewTab);

      await goToFirstField();

      const editTab = screen.getByRole('tab', { name: 'Edit' });
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('with a saved accent hue off the preset', () => {
    beforeEach(() => {
      setup({ initialValues: { ...defaultLookFormValues(), accentHue: 260 } });
    });

    it('offers Reset to preset for differing saved values with no unsaved edits', async () => {
      const unsavedRegion = screen.queryByRole('region', {
        name: UNSAVED_CHANGES,
      });
      expect(unsavedRegion).not.toBeInTheDocument();

      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);

      const hueReadout = screen.getByText('hue 250°');
      const resetButton = screen.queryByRole('button', {
        name: RESET_TO_PRESET,
      });
      expect(hueReadout).toBeVisible();
      expect(resetButton).not.toBeInTheDocument();
    });

    it('resets to the preset in the draft only, so Discard brings the saved values back', async () => {
      const compactButton = screen.getByRole('button', { name: 'Compact' });
      await user.click(compactButton);
      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);

      const resetReadout = screen.getByText('hue 250°');
      expect(resetReadout).toBeVisible();
      expect(updateLookActionMock).not.toHaveBeenCalled();

      const discardButton = screen.getByRole('button', { name: 'Discard' });
      await user.click(discardButton);

      const savedReadout = screen.getByText('hue 260°');
      expect(savedReadout).toBeVisible();
    });
  });

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(() => {
        setup({ archivedAt: MOCK_ARCHIVED_AT });
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('disables every Look control', () => {
        const consolePreset = screen.getByRole('radio', { name: 'Console' });
        const editorialPreset = screen.getByRole('radio', {
          name: 'Editorial',
        });
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
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

      it('disables the Type and Shape controls', () => {
        const headingFont = screen.getByRole('combobox', {
          name: 'Heading font',
        });
        const bodyFont = screen.getByRole('combobox', { name: 'Body font' });
        const smallButton = screen.getByRole('button', { name: 'Small' });
        const extraLargeButton = screen.getByRole('button', {
          name: EXTRA_LARGE,
        });
        const compactButton = screen.getByRole('button', { name: 'Compact' });
        const cardStyleGroup = screen.getByRole('group', {
          name: CARD_STYLE_LABEL,
        });
        const outlinedCardButton = within(cardStyleGroup).getByRole('button', {
          name: 'Outlined',
        });
        const softButton = screen.getByRole('button', { name: 'Soft' });

        expect(headingFont).toHaveAttribute('data-disabled');
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

    it('describes a rejected accent hue with both the archived notice and the error', () => {
      isAccentHueAccessibleMock.mockReturnValue(false);
      setup({ archivedAt: MOCK_ARCHIVED_AT });

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(slider).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${REJECTED_ACCENT_HUE_DESCRIPTION}`,
      );
    });

    it('disables Reset to preset and describes it with the archived notice', () => {
      setup({
        archivedAt: MOCK_ARCHIVED_AT,
        initialValues: { ...defaultLookFormValues(), accentHue: 260 },
      });

      const reset = screen.getByRole('button', { name: RESET_TO_PRESET });
      expect(reset).toBeDisabled();
      expect(reset).toHaveAccessibleDescription(ARCHIVED_NOTICE_DESCRIPTION);
    });
  });

  it('restores unsaved changes after leaving, keeping the current brand images', async () => {
    const { unmount } = setup();
    const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
    await user.click(editorialRadio);
    unmount();

    setupWithSavedLogo();
    const restoreDChangesButton = screen.getByRole('button', {
      name: /^Restore \d+ changes$/,
    });
    await user.click(restoreDChangesButton);

    const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
    const hueReadout = screen.getByText('hue 28°');
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(editorialPreset).toBeChecked();
    expect(hueReadout).toBeVisible();
    expect(logo).toBeVisible();
  });

  it('drops a draft saved before the header buttons style existed', () => {
    const olderValues = Object.fromEntries(
      Object.entries(defaultLookFormValues()).filter(
        ([key]) => key !== 'headerControlStyle',
      ),
    );
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'look' }),
      {
        values: { ...olderValues, accentHue: 260 },
        baseline: olderValues,
        takenAt: new Date().toISOString(),
      },
    );
    setup();

    const restoreButton = screen.queryByRole('button', { name: /^Restore/ });
    const hueReadout = screen.getByText('hue 250°');
    expect(restoreButton).not.toBeInTheDocument();
    expect(hueReadout).toBeVisible();
  });

  describe('brand images', () => {
    describe('with a picked logo', () => {
      beforeEach(async () => {
        setup();
        await pickLogo(user);
      });

      it('stages a picked logo as an unsaved change without uploading it', () => {
        const brandHeading = screen.getByRole('heading', {
          name: 'Brand Unsaved',
        });
        const logo = screen.getByAltText(CURRENT_LOGO);
        expect(brandHeading).toBeVisible();
        expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
        expect(uploadBrandAssetActionMock).not.toHaveBeenCalled();
      });

      it('uploads a staged logo on Save, then saves the rest of the look', async () => {
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveChangesButton);

        const savedNote = await screen.findByText(ALL_CHANGES_SAVED);
        expect(savedNote).toBeVisible();
        const [uploadCall] = uploadBrandAssetActionMock.mock.calls;
        const [uploadTenantId, uploadKind, uploadForm] = uploadCall ?? [];
        expect(uploadTenantId).toBe(MOCK_TENANT_ID);
        expect(uploadKind).toBe('logo');
        expect(uploadForm).toBeInstanceOf(FormData);
        expect(uploadBrandAssetActionMock).toHaveBeenCalledTimes(1);
        expect(updateLookActionMock).toHaveBeenCalled();
        const logo = screen.getByAltText(CURRENT_LOGO);
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(UPLOADED_LOGO_URL),
        );
      });
    });

    describe('while the logo upload is pending', () => {
      let resolveUpload: (value: TUploadResult) => void = () => {};

      beforeEach(async () => {
        uploadBrandAssetActionMock.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveUpload = resolve;
            }),
        );
        setup();
        await pickLogo(user);
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveChangesButton);
      });

      it('locks the edit panel while a save is running', async () => {
        const lockedPanel = await screen.findByTestId(EDIT_PANEL_TEST_ID);
        expect(lockedPanel).toHaveAttribute('inert');

        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: UPLOADED_LOGO_URL,
        });
        await waitFor(() => {
          const editPanel = screen.getByTestId(EDIT_PANEL_TEST_ID);
          expect(editPanel).not.toHaveAttribute('inert');
        });
      });

      it('keeps an edit made while the logo uploads as an unsaved change', async () => {
        await screen.findByRole('button', { name: 'Saving…' });
        const accentHueSlider = screen.getByRole('slider', {
          name: ACCENT_HUE,
        });
        accentHueSlider.focus();
        await user.keyboard(ARROW_RIGHT_KEY);
        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: UPLOADED_LOGO_URL,
        });

        await waitFor(() => {
          const unsavedRegion = screen.getByRole('region', {
            name: UNSAVED_CHANGES,
          });
          expect(unsavedRegion).toHaveTextContent('1 unsaved change');
        });
        const hueReadout = screen.getByText('hue 251°');
        const logo = screen.getByAltText(CURRENT_LOGO);
        expect(hueReadout).toBeVisible();
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(UPLOADED_LOGO_URL),
        );
      });
    });

    describe('with a saved logo', () => {
      beforeEach(() => {
        setupWithSavedLogo();
      });

      it('clears a staged removal on Save', async () => {
        const removeButton = screen.getByRole('button', { name: 'Remove' });
        await user.click(removeButton);
        const saveButton = await screen.findByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(clearBrandAssetActionMock).not.toHaveBeenCalled();
        await user.click(saveButton);

        await waitFor(() => {
          expect(clearBrandAssetActionMock).toHaveBeenCalledWith(
            MOCK_TENANT_ID,
            'logo',
          );
        });
      });

      it('drops a staged logo on Discard, keeping the saved one', async () => {
        await pickLogo(user);
        const discardButton = screen.getByRole('button', { name: 'Discard' });
        await user.click(discardButton);

        const logo = screen.getByAltText(CURRENT_LOGO);
        const savedNote = screen.queryByText(ALL_CHANGES_SAVED);
        expect(logo).toHaveAttribute('src', optimizedImageSrc(MOCK_LOGO_URL));
        expect(savedNote).not.toBeInTheDocument();
        expect(uploadBrandAssetActionMock).not.toHaveBeenCalled();
      });
    });

    describe('when the upload fails', () => {
      beforeEach(() => {
        uploadBrandAssetActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });
        setup();
      });

      it('fails the save with the upload error and keeps the draft when the upload fails', async () => {
        const accentHueSlider = screen.getByRole('slider', {
          name: ACCENT_HUE,
        });
        accentHueSlider.focus();
        await user.keyboard(ARROW_RIGHT_KEY);
        await pickLogo(user);
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveChangesButton);

        const replaceLogoButton = await screen.findByRole('button', {
          name: REPLACE_LOGO,
        });
        await waitFor(() => {
          expect(replaceLogoButton).toHaveFocus();
        });

        const hueReadout = screen.getByText('hue 251°');
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(replaceLogoButton).toHaveAccessibleDescription(
          `${BRAND_IMAGES_HINT} ${LOGO_UPLOAD_FAILED}`,
        );
        expect(saveButton).toBeEnabled();
        expect(updateLookActionMock).not.toHaveBeenCalled();
        expect(hueReadout).toBeVisible();
      });

      describe('after saving a picked logo', () => {
        beforeEach(async () => {
          await pickLogo(user);
          const saveChangesButton = screen.getByRole('button', {
            name: SAVE_CHANGES,
          });
          await user.click(saveChangesButton);
        });

        it('says beside Save that the save did not go through and links to the failed picker', async () => {
          const saveBar = await screen.findByRole('region', {
            name: UNSAVED_CHANGES,
          });
          await waitFor(() => {
            expect(saveBar).toHaveTextContent('Not saved');
          });
          expect(saveBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
          const alert = screen.queryByRole('alert');
          expect(alert).not.toBeInTheDocument();

          const goToFirstOneLink = screen.getByRole('link', {
            name: GO_TO_THE_FIRST_ONE,
          });
          await user.click(goToFirstOneLink);

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
      uploadBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: '4 MB' },
      });
      setup();

      await pickLogo(user);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const error = await screen.findByText(
        'That file is too large — the limit is 4 MB.',
      );
      expect(error).toBeVisible();
      expect(updateLookActionMock).not.toHaveBeenCalled();
    });

    it('fails the save with the remove message when clearing the favicon fails', async () => {
      clearBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup({
        initialValues: {
          ...defaultLookFormValues(),
          favicon: { url: MOCK_LOGO_URL },
        },
      });

      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);
      const saveChangesButton = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

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

    it('restores a draft without its staged logo and asks for it to be picked again', async () => {
      const { unmount } = setup();
      const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
      await user.click(editorialRadio);
      await pickLogo(user);
      unmount();

      setup();
      const restoreDChangesButton = screen.getByRole('button', {
        name: /^Restore \d+ changes$/,
      });
      await user.click(restoreDChangesButton);

      const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });
      const repickNote = screen.getByText(
        "Your recovered draft had a new logo that couldn't be kept — pick it again.",
      );
      expect(editorialPreset).toBeChecked();
      expect(uploadLogoButton).toBeVisible();
      expect(repickNote).toBeVisible();
    });
  });
});
