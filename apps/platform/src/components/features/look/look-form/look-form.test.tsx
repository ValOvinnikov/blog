import {
  ACTION_OUTCOME,
  CARD_STYLE,
  HEADER_CONTROL_STYLE,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import messages from '@platform/i18n/messages/en.json';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import {
  updateLookAction,
  type TUpdateLookResult,
} from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
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
  MOCK_TENANT_NAME,
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

const { lookForm: LOOK_FORM } = messages;
const tLogoHue = makeEnTranslator('logoHueField');
const tUploadErrors = makeEnTranslator('uploadErrors');
const tSaveBar = makeEnTranslator('saveBar');

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
const MOCK_LOGO_FILE = new File(['bytes'], faker.system.commonFileName('png'), {
  type: 'image/png',
});

const HEAVY_FORM_TIMEOUT_MS = 15_000;
const ARROW_RIGHT_KEY = '{ArrowRight}';
const ARIA_SELECTED = 'aria-selected';
const ARIA_PRESSED = 'aria-pressed';
const DATA_DISABLED = 'data-disabled';
const ARIA_DISABLED = 'aria-disabled';
const SAMPLE_TOKENS_TEST_ID = 'look-sample-tokens';
const EDIT_PANEL_TEST_ID = 'look-form-edit-panel';
const FOLLOW_ACCENT_HUE = messages.logoHueField.followAccentHue;
const UPLOAD_FAVICON = messages.assetUploadField.favicon.upload;
const RESET_TO_PRESET = LOOK_FORM.resetButton;
const EXTRA_LARGE = LOOK_FORM.radiusScaleOptionLabel.XL;
const COMPACT = LOOK_FORM.densityOptionLabel.COMPACT;
const OUTLINED = LOOK_FORM.cardStyleOptionLabel.OUTLINED;
const SAVING = 'Saving…';
const GROWTH_PLAN = messages.featuresSettings.planLockedBadge;
const GROWTH_ONLY_FIELD_COUNT = 8;
const RESTORE_CHANGES = /^Restore \d+ changes$/;

const setup = customRender(LookForm, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
  initialValues: defaultLookFormValues(),
  plan: TENANT_PLAN.GROWTH,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
});

const setupWithSavedLogo = () =>
  setup({
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
    languageSwitcherStyle: defaults.languageSwitcherStyle,
    ...overrides,
  };
};

const pickLogo = async (user: UserEvent) => {
  const [logoInput] = screen.getAllByTestId('asset-upload-field-input');
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, MOCK_LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
};

const nudgeAccentHue = async (user: UserEvent) => {
  const accentHueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
  await user.click(accentHueSlider);
  await user.keyboard(ARROW_RIGHT_KEY);
};

const clickSave = async (user: UserEvent) => {
  const saveChangesButton = await screen.findByRole('button', {
    name: SAVE_CHANGES,
  });
  await user.click(saveChangesButton);
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
        setup();
      });

      it('groups the settings into six titled cards', () => {
        const cardHeadings = screen.getAllByRole('heading', { level: 2 });
        const cardTitles = cardHeadings.map((heading) => heading.textContent);

        expect(cardTitles).toEqual([
          LOOK_FORM.presetLabel,
          LOOK_FORM.colourHeading,
          LOOK_FORM.typeHeading,
          LOOK_FORM.shapeHeading,
          LOOK_FORM.brandHeading,
          LOOK_FORM.languageSwitcherLabel,
        ]);
      });

      it('switches between the Edit and Preview tabs', async () => {
        const tabList = screen.getByRole('tablist', {
          name: 'Edit or preview',
        });
        const editTab = within(tabList).getByRole('tab', { name: 'Edit' });
        const previewTab = screen.getByRole('tab', { name: 'Preview' });
        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');

        await user.click(previewTab);

        const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
        const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
        expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'false');
        expect(previewPanel).toContainElement(sampleTokens);
      });

      it("describes each Look control with its field's hint", () => {
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
        const radiusGroup = screen.getByRole('group', {
          name: LOOK_FORM.radiusScaleLabel,
        });

        expect(hueSlider).toHaveAccessibleDescription(
          LOOK_FORM.accentHueDescription,
        );
        expect(followSwitch).toHaveAccessibleDescription(
          LOOK_FORM.logoHueDescription,
        );
        expect(radiusGroup).toHaveAccessibleDescription(
          LOOK_FORM.radiusScaleDescription,
        );
      });

      it('names the logo hue group with its optional tag', () => {
        const logoHueGroup = screen.getByRole('group', {
          name: `${LOOK_FORM.logoHueLabel} ${LOOK_FORM.optionalTag}`,
        });

        expect(logoHueGroup).toBeVisible();
      });

      it('describes each header buttons option', () => {
        const plainButton = screen.getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
        });

        expect(plainButton).toHaveAccessibleDescription(
          LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
        );
      });

      it.each([
        {
          group: LOOK_FORM.headerControlStyleLabel,
          option: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
          saved: { headerControlStyle: HEADER_CONTROL_STYLE.SOFT },
        },
        {
          group: LOOK_FORM.languageSwitcherLabel,
          option: LOOK_FORM.languageSwitcherOptionLabel.CODES,
          saved: { languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES },
        },
        {
          group: LOOK_FORM.cardStyleLabel,
          option: OUTLINED,
          saved: { cardStyle: CARD_STYLE.OUTLINED },
        },
      ])('saves the chosen $group style', async ({ group, option, saved }) => {
        const styleGroup = screen.getByRole('group', { name: group });
        const optionButton = within(styleGroup).getByRole('button', {
          name: option,
        });
        await user.click(optionButton);
        await clickSave(user);

        await waitFor(() => {
          expect(updateLookAction).toHaveBeenCalledWith(
            MOCK_TENANT_ID,
            savedLookValues(saved),
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

        await nudgeAccentHue(user);

        const dirtySaveButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(dirtySaveButton).toBeEnabled();
      });

      it('previews a changed radius scale and density before saving', async () => {
        const extraLargeButton = screen.getByRole('button', {
          name: EXTRA_LARGE,
        });
        await user.click(extraLargeButton);
        const compactButton = screen.getByRole('button', { name: COMPACT });
        await user.click(compactButton);

        const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
        expect(sampleTokens).toHaveStyle({
          '--radius-md': '12px',
          '--spacing-card-x': '0.75rem',
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
            name: `${LOOK_FORM.colourHeading} Unsaved`,
          });
          const typeHeading = screen.getByRole('heading', {
            name: LOOK_FORM.typeHeading,
          });

          expect(colourHeading).toBeVisible();
          expect(typeHeading).toBeVisible();
        });

        it('discards unsaved changes back to the saved values', async () => {
          const discardButton = screen.getByRole('button', { name: 'Discard' });
          await user.click(discardButton);

          const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
          const saveButton = screen.queryByRole('button', {
            name: SAVE_CHANGES,
          });
          expect(hueReadout).toBeVisible();
          expect(saveButton).not.toBeInTheDocument();
        });

        it("resets a diverged control back to the current preset's value", async () => {
          const resetToPresetButton = screen.getByRole('button', {
            name: RESET_TO_PRESET,
          });
          await user.click(resetToPresetButton);

          const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
          expect(hueReadout).toBeVisible();
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

      describe('after choosing the Editorial preset', () => {
        beforeEach(async () => {
          const editorialRadio = screen.getByRole('radio', {
            name: 'Editorial',
          });
          await user.click(editorialRadio);
        });

        it("resets the accent hue to the preset's", () => {
          const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));

          expect(hueReadout).toBeVisible();
        });

        it("previews the preset's card style", () => {
          const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

          expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
        });
      });
    },
  );

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

  it('keeps an already-saved brand image when a preset is chosen', async () => {
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

    const headerButtons = screen.getByRole('group', {
      name: LOOK_FORM.headerControlStyleLabel,
    });
    const outlinedButton = within(headerButtons).getByRole('button', {
      name: LOOK_FORM.headerControlStyleOptionLabel.OUTLINED,
    });
    expect(outlinedButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('shows a single-language note and no switcher choice with one language', () => {
    setup({ liveLocales: [LOCALE_ISO_CODES.EN] });

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
    setup();

    await nudgeAccentHue(user);
    await clickSave(user);

    const saveButton = await screen.findByRole('button', { name: SAVING });
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toHaveAttribute(ARIA_DISABLED, 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
    await screen.findByText(ALL_CHANGES_SAVED);
  });

  it('shows an error alert in the save bar when the save fails', async () => {
    vi.mocked(updateLookAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await nudgeAccentHue(user);
    await clickSave(user);

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: HEAVY_FORM_TIMEOUT_MS },
    );
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    expect(alert).toHaveTextContent(LOOK_FORM.alertError);
    expect(saveBar).toContainElement(alert);
  });

  describe('when the accent hue is rejected', () => {
    beforeEach(async () => {
      vi.mocked(isAccentHueAccessible).mockImplementation(
        (hue) => hue !== NUDGED_ACCENT_HUE,
      );
      setup();
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
      const goToFirstOneLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(goToFirstOneLink);

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(slider).toHaveFocus();
    });

    it('returns to the Edit tab to focus the accent hue slider from the Preview', async () => {
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      await user.click(previewTab);
      const goToFirstOneLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(goToFirstOneLink);

      const editTab = screen.getByRole('tab', { name: 'Edit' });
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('with a saved accent hue off the preset', () => {
    beforeEach(() => {
      setup({
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

      const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      const resetButton = screen.queryByRole('button', {
        name: RESET_TO_PRESET,
      });
      expect(hueReadout).toBeVisible();
      expect(resetButton).not.toBeInTheDocument();
    });

    it('resets to the preset in the draft only, so Discard restores the saved look', async () => {
      const compactButton = screen.getByRole('button', { name: COMPACT });
      await user.click(compactButton);
      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);

      const resetReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      expect(resetReadout).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();

      const discardButton = screen.getByRole('button', { name: 'Discard' });
      await user.click(discardButton);

      const savedReadout = screen.getByText(hueValue(MOCK_SAVED_ACCENT_HUE));
      expect(savedReadout).toBeVisible();
    });
  });

  describe('on Free', () => {
    beforeEach(() => {
      setup({ plan: TENANT_PLAN.FREE });
    });

    it('locks every Growth-only field with the Growth plan badge', () => {
      const locks = screen.getAllByText(GROWTH_PLAN);
      const headingFont = screen.getByRole('combobox', {
        name: LOOK_FORM.headingFontLabel,
      });
      const extraLargeButton = screen.getByRole('button', {
        name: EXTRA_LARGE,
      });
      const followSwitch = screen.getByRole('switch', {
        name: FOLLOW_ACCENT_HUE,
      });
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

    it('keeps the preset, accent hue and brand images editable', () => {
      const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });

      expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hueSlider).toBeEnabled();
      expect(uploadLogoButton).toBeEnabled();
    });

    it("previews a new preset's own fonts and corners", async () => {
      const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
      await user.click(editorialRadio);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const sampleTokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);
      expect(smallButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(sampleTokens).toHaveStyle({ '--radius-md': '3px' });
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
          name: LOOK_FORM.headingFontLabel,
        });
        const bodyFont = screen.getByRole('combobox', {
          name: LOOK_FORM.bodyFontLabel,
        });
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

    it('describes a rejected accent hue with both the archived notice and the error', () => {
      vi.mocked(isAccentHueAccessible).mockReturnValue(false);
      setup({ archivedAt: MOCK_ARCHIVED_AT });

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });

      expect(slider).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${REJECTED_ACCENT_HUE_DESCRIPTION}`,
      );
    });

    it('disables Reset to preset and describes it with the archived notice', () => {
      setup({
        archivedAt: MOCK_ARCHIVED_AT,
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
    const { unmount } = setup();
    const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
    await user.click(editorialRadio);
    unmount();

    setupWithSavedLogo();
    const restoreChangesButton = screen.getByRole('button', {
      name: RESTORE_CHANGES,
    });
    await user.click(restoreChangesButton);

    const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
    const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
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
        values: { ...olderValues, accentHue: MOCK_SAVED_ACCENT_HUE },
        baseline: olderValues,
        takenAt: MOCK_DRAFT_TAKEN_AT,
      },
    );
    setup();

    const restoreButton = screen.queryByRole('button', { name: /^Restore/ });
    const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
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
          name: `${LOOK_FORM.brandHeading} Unsaved`,
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
        setup();
        await pickLogo(user);
        await clickSave(user);
      });

      it('locks the edit panel while a save is running', async () => {
        const lockedPanel = await screen.findByTestId(EDIT_PANEL_TEST_ID);
        expect(lockedPanel).toHaveAttribute('inert');

        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: MOCK_UPLOADED_LOGO_URL,
        });

        await waitFor(() => {
          const editPanel = screen.getByTestId(EDIT_PANEL_TEST_ID);
          expect(editPanel).not.toHaveAttribute('inert');
        });
      });

      it('keeps an edit made while the logo uploads as an unsaved change', async () => {
        await screen.findByRole('button', { name: SAVING });
        await nudgeAccentHue(user);
        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: MOCK_UPLOADED_LOGO_URL,
        });

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
        const removeButton = screen.getByRole('button', {
          name: messages.assetUploadField.remove,
        });
        await user.click(removeButton);
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
        const discardButton = screen.getByRole('button', { name: 'Discard' });
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
        setup();
      });

      it('fails the save on the logo picker and keeps the draft', async () => {
        await nudgeAccentHue(user);
        await pickLogo(user);
        await clickSave(user);

        const replaceLogoButton = await screen.findByRole('button', {
          name: REPLACE_LOGO,
        });
        await waitFor(() => {
          expect(replaceLogoButton).toHaveFocus();
        });
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(replaceLogoButton).toHaveAccessibleDescription(
          `${BRAND_IMAGES_HINT} ${LOGO_UPLOAD_FAILED}`,
        );
        expect(saveButton).toBeEnabled();
        expect(updateLookAction).not.toHaveBeenCalled();
        expect(hueReadout).toBeVisible();
      });

      describe('after saving a picked logo', () => {
        beforeEach(async () => {
          await pickLogo(user);
          await clickSave(user);
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
      vi.mocked(uploadBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: MOCK_UPLOAD_LIMIT },
      });
      setup();

      await pickLogo(user);
      await clickSave(user);

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
      setup({
        initialValues: {
          ...defaultLookFormValues(),
          favicon: { url: MOCK_LOGO_URL },
        },
      });

      const removeButton = screen.getByRole('button', {
        name: messages.assetUploadField.remove,
      });
      await user.click(removeButton);
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
      const { unmount } = setup();
      const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
      await user.click(editorialRadio);
      await pickLogo(user);
      unmount();

      setup();
      const restoreChangesButton = screen.getByRole('button', {
        name: RESTORE_CHANGES,
      });
      await user.click(restoreChangesButton);

      const editorialPreset = screen.getByRole('radio', { name: 'Editorial' });
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
