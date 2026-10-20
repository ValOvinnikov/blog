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
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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
  ...(await importOriginal<typeof import('@blog/config')>()),
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

const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');
const SAVED_LOGO_URL = 'https://example.blob.vercel-storage.com/logo.png';
const UPLOADED_LOGO_URL =
  'https://example.blob.vercel-storage.com/logo-new.png';
const LOGO_FILE = new File(['bytes'], 'logo.png', { type: 'image/png' });

const pickLogo = async (user: UserEvent) => {
  const [logoInput] = screen.getAllByTestId('asset-upload-field-input');
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText('Current logo');
    expect(logo).toHaveAttribute('src', 'blob:staged-logo');
  });
};

const setup = customRender(LookForm, {
  tenantId: 'tenant-1',
  tenantName: 'Acme Inc.',
  initialValues: defaultLookFormValues(),
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
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
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:staged-logo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setup();
    });

    it(
      'renders the current preset and accent hue from the given initial values',
      { timeout: 15000 },
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

    it('marks only the card holding an unsaved change', async () => {
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');

      const colourHeading = screen.getByRole('heading', {
        name: 'Colour Unsaved',
      });
      const typeHeading = screen.getByRole('heading', { name: 'Type' });
      expect(colourHeading).toBeVisible();
      expect(typeHeading).toBeVisible();
    });

    it('switches between the Edit and Preview tabs', async () => {
      const editTab = within(
        screen.getByRole('tablist', { name: 'Edit or preview' }),
      ).getByRole('tab', { name: 'Edit' });
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      expect(editTab).toHaveAttribute('aria-selected', 'true');

      await user.click(previewTab);

      expect(previewTab).toHaveAttribute('aria-selected', 'true');
      expect(editTab).toHaveAttribute('aria-selected', 'false');
      const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
      const sampleTokens = screen.getByTestId('look-sample-tokens');
      expect(previewPanel).toContainElement(sampleTokens);
    });

    it("describes each Look control with its field's hint", () => {
      const hueSlider = screen.getByRole('slider', { name: 'Accent hue' });
      const followSwitch = screen.getByRole('switch', {
        name: 'Follow accent hue',
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
      const hint = 'Logo: PNG, JPEG, WebP or SVG. Favicon: a square image.';
      const uploadLogoButton = screen.getByRole('button', {
        name: 'Upload logo',
      });
      const uploadFaviconButton = screen.getByRole('button', {
        name: 'Upload favicon',
      });

      expect(uploadLogoButton).toHaveAccessibleDescription(hint);
      expect(uploadFaviconButton).toHaveAccessibleDescription(hint);
    });

    it("choosing a preset resets every one of that preset's defaults", async () => {
      await user.click(screen.getByRole('radio', { name: 'Editorial' }));

      const hueReadout = screen.getByText('hue 28°');
      expect(hueReadout).toBeVisible();
    });

    it('saves the current form state through updateLookAction', async () => {
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith('tenant-1', {
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

    it('saves the chosen header buttons style and marks Shape unsaved', async () => {
      await user.click(screen.getByRole('button', { name: 'Soft' }));

      const shapeHeading = screen.getByRole('heading', {
        name: 'Shape Unsaved',
      });
      expect(shapeHeading).toBeVisible();

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
          }),
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
      await user.click(screen.getByRole('button', { name: 'Compact codes' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
          }),
        );
      });
    });

    it('shows a save-confirmation toast once the save resolves', async () => {
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const toast = await screen.findByText('Look saved.');
      expect(toast).toBeVisible();
    });

    it('offers Save changes only once the form is dirty', async () => {
      const idleSaveButton = screen.queryByRole('button', {
        name: 'Save changes',
      });
      const savedNote = screen.queryByText('All changes saved');
      expect(idleSaveButton).not.toBeInTheDocument();
      expect(savedNote).not.toBeInTheDocument();

      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');

      const dirtySaveButton = screen.getByRole('button', {
        name: 'Save changes',
      });
      expect(dirtySaveButton).toBeEnabled();
    });

    it('hides Reset to preset while every preset-controlled value matches the preset', () => {
      const resetButton = screen.queryByRole('button', {
        name: 'Reset to preset',
      });
      expect(resetButton).not.toBeInTheDocument();
    });

    it('discards unsaved changes back to the saved values', async () => {
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      const hueReadout = screen.getByText('hue 250°');
      const saveButton = screen.queryByRole('button', { name: 'Save changes' });
      expect(hueReadout).toBeVisible();
      expect(saveButton).not.toBeInTheDocument();
    });

    it('hides the save bar once the save resolves', async () => {
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const savedNote = await screen.findByText('All changes saved');
      const saveButton = screen.queryByRole('button', { name: 'Save changes' });
      expect(savedNote).toBeVisible();
      expect(saveButton).not.toBeInTheDocument();
    });

    it('previews a changed radius scale and density before saving', async () => {
      await user.click(screen.getByRole('button', { name: 'Extra large' }));
      await user.click(screen.getByRole('button', { name: 'Compact' }));

      const sampleTokens = screen.getByTestId('look-sample-tokens');
      expect(sampleTokens).toHaveStyle({
        '--radius-md': '12px',
        '--spacing-card-x': '0.75rem',
      });
    });

    it('previews and saves the outlined card style', async () => {
      await user.click(
        within(screen.getByRole('group', { name: 'Card style' })).getByRole(
          'button',
          { name: 'Outlined' },
        ),
      );

      const sampleTokens = screen.getByTestId('look-sample-tokens');
      expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateLookActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({ cardStyle: CARD_STYLE.OUTLINED }),
        );
      });
    });

    it("choosing a preset applies that preset's card style", async () => {
      await user.click(screen.getByRole('radio', { name: 'Editorial' }));

      const sampleTokens = screen.getByTestId('look-sample-tokens');
      expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
    });

    it('resets a diverged control back to the current preset on "Reset to preset"', async () => {
      const slider = screen.getByRole('slider', { name: 'Accent hue' });
      slider.focus();
      await user.keyboard('{ArrowRight}');
      const changedReadout = screen.getByText('hue 251°');
      expect(changedReadout).toBeVisible();

      await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

      const resetReadout = screen.getByText('hue 250°');
      expect(resetReadout).toBeVisible();
    });

    it('leaves every Look control enabled for a non-archived tenant', () => {
      const consolePreset = screen.getByRole('radio', { name: 'Console' });
      const hueSlider = screen.getByRole('slider', { name: 'Accent hue' });
      const followSwitch = screen.getByRole('switch', {
        name: 'Follow accent hue',
      });
      const uploadLogoButton = screen.getByRole('button', {
        name: 'Upload logo',
      });
      const smallButton = screen.getByRole('button', { name: 'Small' });

      expect(consolePreset).not.toHaveAttribute('aria-disabled', 'true');
      expect(hueSlider).toBeEnabled();
      expect(followSwitch).not.toHaveAttribute('aria-disabled', 'true');
      expect(uploadLogoButton).toBeEnabled();
      expect(smallButton).toBeEnabled();
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
    setup({
      initialValues: {
        ...defaultLookFormValues(),
        logo: { url: SAVED_LOGO_URL },
      },
    });

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    const logo = screen.getByAltText('Current logo');
    expect(logo).toBeVisible();
  });

  it('resets the header buttons style with the rest of the preset', async () => {
    setup({
      initialValues: {
        ...defaultLookFormValues(),
        headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
      },
    });

    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

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
      name: 'Compact codes',
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

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

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

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');
    const saveBar = screen.getByRole('region', { name: 'Unsaved changes' });
    expect(alert).toHaveTextContent("Couldn't save Look settings");
    expect(saveBar).toContainElement(alert);
  });

  it('offers Reset to preset for differing saved values with no unsaved edits', async () => {
    setup({ initialValues: { ...defaultLookFormValues(), accentHue: 260 } });

    const unsavedRegion = screen.queryByRole('region', {
      name: 'Unsaved changes',
    });
    expect(unsavedRegion).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

    const hueReadout = screen.getByText('hue 250°');
    const resetButton = screen.queryByRole('button', {
      name: 'Reset to preset',
    });
    expect(hueReadout).toBeVisible();
    expect(resetButton).not.toBeInTheDocument();
  });

  it('rejects an accent hue the site would replace, with a message, and blocks Save', async () => {
    isAccentHueAccessibleMock.mockImplementation((hue) => hue !== 251);
    setup();

    const slider = screen.getByRole('slider', { name: 'Accent hue' });
    slider.focus();
    await user.keyboard('{ArrowRight}');

    expect(slider).toHaveAccessibleDescription(
      expect.stringContaining('the site would replace it'),
    );
    const attentionNote = screen.getByText('1 field needs attention');
    expect(attentionNote).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateLookActionMock).not.toHaveBeenCalled();
  });

  describe('when the accent hue is rejected', () => {
    const rejectAccentHue = async () => {
      const slider = screen.getByRole('slider', { name: 'Accent hue' });
      slider.focus();
      await user.keyboard('{ArrowRight}');
      slider.blur();
    };

    const goToFirstField = () =>
      user.click(screen.getByRole('link', { name: 'Go to the first one' }));

    beforeEach(() => {
      isAccentHueAccessibleMock.mockImplementation((hue) => hue !== 251);
      setup();
    });

    it('focuses the accent hue slider from the save bar', async () => {
      await rejectAccentHue();

      await goToFirstField();

      const slider = screen.getByRole('slider', { name: 'Accent hue' });
      expect(slider).toHaveFocus();
    });

    it('returns to the Edit tab and focuses the accent hue slider from the Preview', async () => {
      await rejectAccentHue();
      await user.click(screen.getByRole('tab', { name: 'Preview' }));

      await goToFirstField();

      const editTab = screen.getByRole('tab', { name: 'Edit' });
      const slider = screen.getByRole('slider', { name: 'Accent hue' });
      expect(editTab).toHaveAttribute('aria-selected', 'true');
      expect(slider).toHaveFocus();
    });
  });

  it('resets to the preset in the draft only, so Discard brings the saved values back', async () => {
    setup({ initialValues: { ...defaultLookFormValues(), accentHue: 260 } });

    await user.click(screen.getByRole('button', { name: 'Compact' }));
    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

    const resetReadout = screen.getByText('hue 250°');
    expect(resetReadout).toBeVisible();
    expect(updateLookActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    const savedReadout = screen.getByText('hue 260°');
    expect(savedReadout).toBeVisible();
  });

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(() => {
        setup({ archivedAt: ARCHIVED_AT });
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('disables every Look control', () => {
        const consolePreset = screen.getByRole('radio', { name: 'Console' });
        const editorialPreset = screen.getByRole('radio', {
          name: 'Editorial',
        });
        const hueSlider = screen.getByRole('slider', { name: 'Accent hue' });
        const followSwitch = screen.getByRole('switch', {
          name: 'Follow accent hue',
        });
        const uploadLogoButton = screen.getByRole('button', {
          name: 'Upload logo',
        });
        const uploadFaviconButton = screen.getByRole('button', {
          name: 'Upload favicon',
        });

        expect(consolePreset).toHaveAttribute('aria-disabled', 'true');
        expect(editorialPreset).toHaveAttribute('aria-disabled', 'true');
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
          name: 'Extra large',
        });
        const compactButton = screen.getByRole('button', { name: 'Compact' });
        const cardStyleGroup = screen.getByRole('group', {
          name: 'Card style',
        });
        const outlinedCardButton = within(cardStyleGroup).getByRole('button', {
          name: 'Outlined',
        });
        const softButton = screen.getByRole('button', { name: 'Soft' });

        expect(headingFont).toHaveAttribute('data-disabled');
        expect(bodyFont).toHaveAccessibleDescription(/This tenant is archived/);
        expect(smallButton).toBeDisabled();
        expect(extraLargeButton).toBeDisabled();
        expect(compactButton).toBeDisabled();
        expect(outlinedCardButton).toBeDisabled();
        expect(softButton).toBeDisabled();
      });
    });

    it('describes a rejected accent hue with both the archived notice and the error', () => {
      isAccentHueAccessibleMock.mockReturnValue(false);
      setup({ archivedAt: ARCHIVED_AT });

      const slider = screen.getByRole('slider', { name: 'Accent hue' });
      expect(slider).toHaveAccessibleDescription(/This tenant is archived/);
      expect(slider).toHaveAccessibleDescription(/the site would replace it/);
    });

    it('disables Reset to preset and describes it with the archived notice', () => {
      setup({
        archivedAt: ARCHIVED_AT,
        initialValues: { ...defaultLookFormValues(), accentHue: 260 },
      });

      const reset = screen.getByRole('button', { name: 'Reset to preset' });
      expect(reset).toBeDisabled();
      expect(reset).toHaveAccessibleDescription(/This tenant is archived/);
    });
  });

  it('restores unsaved changes after leaving, keeping the current brand images', async () => {
    const { unmount } = setup();
    await user.click(screen.getByRole('radio', { name: 'Editorial' }));
    unmount();

    setup({
      initialValues: {
        ...defaultLookFormValues(),
        logo: { url: SAVED_LOGO_URL },
      },
    });
    await user.click(
      screen.getByRole('button', { name: /^Restore \d+ changes$/ }),
    );

    const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
    const hueReadout = screen.getByText('hue 28°');
    const logo = screen.getByAltText('Current logo');
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
      settingsDraftStorageKey({ tenantId: 'tenant-1', page: 'look' }),
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
    describe('with the default values', () => {
      beforeEach(() => {
        setup();
      });

      it('stages a picked logo as an unsaved change without uploading it', async () => {
        await pickLogo(user);

        const brandHeading = screen.getByRole('heading', {
          name: 'Brand Unsaved',
        });
        const logo = screen.getByAltText('Current logo');
        expect(brandHeading).toBeVisible();
        expect(logo).toHaveAttribute('src', 'blob:staged-logo');
        expect(uploadBrandAssetActionMock).not.toHaveBeenCalled();
      });

      it('uploads a staged logo on Save, then saves the rest of the look', async () => {
        await pickLogo(user);
        await user.click(screen.getByRole('button', { name: 'Save changes' }));

        const savedNote = await screen.findByText('All changes saved');
        expect(savedNote).toBeVisible();
        expect(uploadBrandAssetActionMock).toHaveBeenCalledWith(
          'tenant-1',
          'logo',
          expect.any(FormData),
        );
        expect(updateLookActionMock).toHaveBeenCalled();
        const logo = screen.getByAltText('Current logo');
        expect(logo).toHaveAttribute(
          'src',
          expect.stringContaining(encodeURIComponent(UPLOADED_LOGO_URL)),
        );
      });
    });

    it('locks the edit panel while a save is running', async () => {
      let resolveUpload: (value: TUploadResult) => void = () => {};
      uploadBrandAssetActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpload = resolve;
          }),
      );
      setup();

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const lockedPanel = await screen.findByTestId('look-form-edit-panel');
      expect(lockedPanel).toHaveAttribute('inert');

      resolveUpload({
        outcome: ACTION_OUTCOME.SUCCESS,
        url: UPLOADED_LOGO_URL,
      });
      await waitFor(() => {
        const editPanel = screen.getByTestId('look-form-edit-panel');
        expect(editPanel).not.toHaveAttribute('inert');
      });
    });

    it('keeps an edit made while the logo uploads as an unsaved change', async () => {
      let resolveUpload: (value: TUploadResult) => void = () => {};
      uploadBrandAssetActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpload = resolve;
          }),
      );
      setup();

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByRole('button', { name: 'Saving…' });
      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      resolveUpload({
        outcome: ACTION_OUTCOME.SUCCESS,
        url: UPLOADED_LOGO_URL,
      });

      await waitFor(() => {
        const unsavedRegion = screen.getByRole('region', {
          name: 'Unsaved changes',
        });
        expect(unsavedRegion).toHaveTextContent('1 unsaved change');
      });
      const hueReadout = screen.getByText('hue 251°');
      const logo = screen.getByAltText('Current logo');
      expect(hueReadout).toBeVisible();
      expect(logo).toHaveAttribute(
        'src',
        expect.stringContaining(encodeURIComponent(UPLOADED_LOGO_URL)),
      );
    });

    it('clears a staged removal on Save', async () => {
      setup({
        initialValues: {
          ...defaultLookFormValues(),
          logo: { url: SAVED_LOGO_URL },
        },
      });

      await user.click(screen.getByRole('button', { name: 'Remove' }));
      const saveButton = await screen.findByRole('button', {
        name: 'Save changes',
      });
      expect(clearBrandAssetActionMock).not.toHaveBeenCalled();
      await user.click(saveButton);

      await waitFor(() => {
        expect(clearBrandAssetActionMock).toHaveBeenCalledWith(
          'tenant-1',
          'logo',
        );
      });
    });

    it('drops a staged logo on Discard, keeping the saved one', async () => {
      setup({
        initialValues: {
          ...defaultLookFormValues(),
          logo: { url: SAVED_LOGO_URL },
        },
      });

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      const logo = screen.getByAltText('Current logo');
      const savedNote = screen.queryByText('All changes saved');
      expect(logo).toHaveAttribute(
        'src',
        expect.stringContaining(encodeURIComponent(SAVED_LOGO_URL)),
      );
      expect(savedNote).not.toBeInTheDocument();
      expect(uploadBrandAssetActionMock).not.toHaveBeenCalled();
    });

    it('fails the save with the upload error and keeps the draft when the upload fails', async () => {
      uploadBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();

      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');
      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const replaceLogoButton = await screen.findByRole('button', {
        name: 'Replace logo',
      });
      await waitFor(() => {
        expect(replaceLogoButton).toHaveFocus();
      });

      const hueReadout = screen.getByText('hue 251°');
      const saveButton = screen.getByRole('button', { name: 'Save changes' });
      expect(replaceLogoButton).toHaveAccessibleDescription(
        expect.stringContaining("Couldn't upload the logo — try again."),
      );
      expect(saveButton).toBeEnabled();
      expect(updateLookActionMock).not.toHaveBeenCalled();
      expect(hueReadout).toBeVisible();
    });

    it('says beside Save that the save did not go through and links to the failed picker', async () => {
      uploadBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const saveBar = await screen.findByRole('region', {
        name: 'Unsaved changes',
      });
      await waitFor(() => {
        expect(saveBar).toHaveTextContent('Not saved');
      });
      expect(saveBar).toHaveTextContent('1 field needs attention');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await user.click(
        screen.getByRole('link', { name: 'Go to the first one' }),
      );

      const replaceLogoButton = screen.getByRole('button', {
        name: 'Replace logo',
      });
      expect(replaceLogoButton).toHaveFocus();
    });

    it('clears the picker error once a new logo is picked', async () => {
      uploadBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText("Couldn't upload the logo — try again.");
      await pickLogo(user);

      const error = screen.queryByText("Couldn't upload the logo — try again.");
      const attentionLink = screen.queryByRole('link', {
        name: 'Go to the first one',
      });
      expect(error).not.toBeInTheDocument();
      expect(attentionLink).not.toBeInTheDocument();
    });

    it('fails the save with the refusal message when the upload is refused', async () => {
      uploadBrandAssetActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: '4 MB' },
      });
      setup();

      await pickLogo(user);
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

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
          favicon: { url: SAVED_LOGO_URL },
        },
      });

      await user.click(screen.getByRole('button', { name: 'Remove' }));
      await user.click(
        await screen.findByRole('button', { name: 'Save changes' }),
      );

      const uploadFaviconButton = await screen.findByRole('button', {
        name: 'Upload favicon',
      });
      await waitFor(() => {
        expect(uploadFaviconButton).toHaveFocus();
      });
      expect(uploadFaviconButton).toHaveAccessibleDescription(
        expect.stringContaining("Couldn't remove the favicon — try again."),
      );
    });

    it('restores a draft without its staged logo and asks for it to be picked again', async () => {
      const { unmount } = setup();
      await user.click(screen.getByRole('radio', { name: 'Editorial' }));
      await pickLogo(user);
      unmount();

      setup();
      await user.click(
        screen.getByRole('button', { name: /^Restore \d+ changes$/ }),
      );

      const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
      const uploadLogoButton = screen.getByRole('button', {
        name: 'Upload logo',
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
