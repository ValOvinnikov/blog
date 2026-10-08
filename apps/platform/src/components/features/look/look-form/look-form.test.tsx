import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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

const setup = customRender(LookForm, {
  tenantId: 'tenant-1',
  tenantName: 'Acme Inc.',
  initialValues: defaultLookFormValues(),
  hasMultipleLanguages: true,
});

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    updateLookActionMock.mockReset();
    updateLookActionMock.mockResolvedValue({ ok: true });
    isAccentHueAccessibleMock.mockReset();
    isAccentHueAccessibleMock.mockReturnValue(true);
  });

  it(
    'renders the current preset and accent hue from the given initial values',
    { timeout: 15000 },
    () => {
      setup();

      expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByText('250°')).toBeVisible();
    },
  );

  it('groups the settings into Preset, Colour, Type, Shape, Brand and Language switcher cards', () => {
    setup();

    for (const name of [
      'Preset',
      'Colour',
      'Type',
      'Shape',
      'Brand',
      'Language switcher',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeVisible();
    }
  });

  it('marks only the card holding an unsaved change', async () => {
    setup();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(
      screen.getByRole('heading', { name: 'Colour Unsaved changes' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Type' })).toBeVisible();
  });

  it('switches between the Edit and Preview tabs', async () => {
    setup();

    const editTab = screen.getByRole('tab', { name: 'Edit' });
    const previewTab = screen.getByRole('tab', { name: 'Preview' });
    expect(editTab).toHaveAttribute('aria-selected', 'true');

    await user.click(previewTab);

    expect(previewTab).toHaveAttribute('aria-selected', 'true');
    expect(editTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).toContainElement(
      screen.getByTestId('preview-sample-tokens'),
    );
  });

  it('shows the favicon square requirement before any file is chosen', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeVisible();
    expect(screen.getByText(/Pre-cropped square, please/)).toBeVisible();
  });

  it("choosing a preset doesn't clear an already-saved brand image", async () => {
    setup({
      initialValues: {
        ...defaultLookFormValues(),
        logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      },
    });

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(screen.getByAltText('Current logo')).toBeVisible();
  });

  it("choosing a preset resets every one of that preset's defaults", async () => {
    setup();

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(screen.getByText('28°')).toBeVisible();
  });

  it('saves the current form state through updateLookAction', async () => {
    setup();

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
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      });
    });
  });

  it('saves the chosen language switcher style', async () => {
    setup();

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

  it('shows a note instead of the language switcher choice with one live language', () => {
    setup({ hasMultipleLanguages: false });

    expect(
      screen.getByText(
        'Add another language in Languages settings to choose a style.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Compact codes' }),
    ).not.toBeInTheDocument();
  });

  it('shows a save-confirmation toast once the save resolves', async () => {
    setup();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Saved to site_config.')).toBeVisible();
  });

  it('marks Save busy while the save is in flight', async () => {
    let resolveAction: (value: { ok: boolean }) => void = () => {};
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

    resolveAction({ ok: true });
  });

  it('shows an error alert when the save fails', async () => {
    updateLookActionMock.mockResolvedValue({ ok: false });
    setup();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't save Look settings",
    );
  });

  it('offers Save changes and enables Reset to preset only once the form is dirty', async () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'Reset to preset' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(
      screen.getByRole('button', { name: 'Reset to preset' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('discards unsaved changes back to the saved values', async () => {
    setup();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByText('250°')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
  });

  it('hides the save bar once the save resolves', async () => {
    setup();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('All changes saved')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
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
    expect(screen.getByText('1 field needs attention')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateLookActionMock).not.toHaveBeenCalled();
  });

  it('previews a changed radius scale and density before saving', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: 'Extra Large' }));
    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--radius-md': '12px',
      '--spacing-card-x': '0.75rem',
    });
  });

  it('previews and saves the outlined card style', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: 'Outlined' }));

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--item-border-width': '1px',
    });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateLookActionMock).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ cardStyle: CARD_STYLE.OUTLINED }),
      );
    });
  });

  it("choosing a preset applies that preset's card style", async () => {
    setup();

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--item-border-width': '1px',
    });
  });

  it('resets a diverged control back to the current preset on "Reset to preset"', async () => {
    setup();

    const slider = screen.getByRole('slider', { name: 'Accent hue' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('251°')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

    expect(screen.getByText('250°')).toBeVisible();
  });

  it('resets to the preset in the draft only, so Discard brings the saved values back', async () => {
    setup({ initialValues: { ...defaultLookFormValues(), accentHue: 260 } });

    await user.click(screen.getByRole('button', { name: 'Compact' }));
    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

    expect(screen.getByText('250°')).toBeVisible();
    expect(updateLookActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByText('260°')).toBeVisible();
  });

  describe('archived tenant', () => {
    it('shows an archived notice and offers no Save', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expectArchivedOffersNoSave();
    });

    it('disables every Look control', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(screen.getByRole('radio', { name: 'Editorial' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(screen.getByRole('slider', { name: 'Accent hue' })).toBeDisabled();
      expect(
        screen.getByRole('switch', { name: 'Follow accent hue' }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('button', { name: 'Upload logo' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Upload favicon' }),
      ).toBeDisabled();
    });

    it('disables the Type and Shape controls', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expect(
        screen.getAllByRole('radio', { name: 'Space Grotesk' })[0],
      ).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('button', { name: 'Small' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Extra Large' }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Compact' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Outlined' })).toBeDisabled();
    });

    it('describes the disabled Reset button with the archived notice text, for a screen-reader user', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expect(
        screen.getByRole('button', { name: 'Reset to preset' }),
      ).toHaveAccessibleDescription(/This tenant is archived/);
    });
  });

  it('leaves every Look control enabled for a non-archived tenant', () => {
    setup();

    expect(screen.getByRole('radio', { name: 'Console' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('slider', { name: 'Accent hue' })).toBeEnabled();
    expect(
      screen.getByRole('switch', { name: 'Follow accent hue' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Small' })).toBeEnabled();
  });

  it('restores unsaved Look changes after leaving the page, keeping the current brand images', async () => {
    const { unmount } = setup();
    await user.click(screen.getByRole('radio', { name: 'Editorial' }));
    unmount();

    setup({
      initialValues: {
        ...defaultLookFormValues(),
        logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      },
    });
    await user.click(
      screen.getByRole('button', { name: /^Restore \d+ changes$/ }),
    );

    expect(screen.getByRole('radio', { name: 'Editorial' })).toBeChecked();
    expect(screen.getByText('28°')).toBeVisible();
    expect(screen.getByAltText('Current logo')).toBeVisible();
  });
});
