import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
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
  primaryDomain: 'acme.example.com',
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

  it('renders Basic and Advanced as visually distinct sections, Advanced collapsed by default', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Basic' })).toBeVisible();
    expect(screen.getByText('Advanced')).toBeVisible();
    expect(screen.getByTestId('disclosure')).not.toHaveAttribute('open');
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

  it('shows the language switcher style outside the collapsed Advanced section', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Compact codes' })).toBeVisible();
    expect(
      within(screen.getByTestId('disclosure')).queryByText('Language switcher'),
    ).not.toBeInTheDocument();
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

  it('shows a spinner, marks Save busy, and announces the pending state to assistive tech while the save is in flight', async () => {
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
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

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

  it('disables Reset to preset and Save changes until the form is dirty', async () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'Reset to preset' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(
      screen.getByRole('button', { name: 'Reset to preset' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
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
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('previews a changed radius scale and density before saving', async () => {
    setup();

    await user.click(screen.getByText('Advanced'));
    await user.click(screen.getByRole('button', { name: 'Extra Large' }));
    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--radius-md': '12px',
      '--spacing-card-x': '0.75rem',
    });
  });

  it('previews and saves the outlined card style', async () => {
    setup();

    await user.click(screen.getByText('Advanced'));
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

  describe('archived tenant', () => {
    it('shows an archived notice and disables Save even once dirty', async () => {
      setup({ archivedAt: ARCHIVED_AT });

      expect(screen.getByText('This tenant is archived')).toBeVisible();

      screen.getByRole('slider', { name: 'Accent hue' }).focus();
      await user.keyboard('{ArrowRight}');

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
      expect(updateLookActionMock).not.toHaveBeenCalled();
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

    it('disables the Advanced section controls', async () => {
      setup({ archivedAt: ARCHIVED_AT });

      await user.click(screen.getByText('Advanced'));

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

    it('describes the disabled Save and Reset buttons with the archived notice text, for a screen-reader user', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toHaveAccessibleDescription(/This tenant is archived/);
      expect(
        screen.getByRole('button', { name: 'Reset to preset' }),
      ).toHaveAccessibleDescription(/This tenant is archived/);
    });
  });

  it('leaves every Look control enabled for a non-archived tenant', async () => {
    setup();

    await user.click(screen.getByText('Advanced'));

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
});
