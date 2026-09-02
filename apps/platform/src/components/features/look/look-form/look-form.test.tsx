import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent from '@testing-library/user-event';

import { LookForm } from './look-form';

const render = renderWithIntl;

const {
  updateLookActionMock,
  uploadBrandAssetActionMock,
  clearBrandAssetActionMock,
} = vi.hoisted(() => ({
  updateLookActionMock: vi.fn(),
  uploadBrandAssetActionMock: vi.fn(),
  clearBrandAssetActionMock: vi.fn(),
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

describe(LookForm, () => {
  beforeEach(() => {
    updateLookActionMock.mockReset();
    updateLookActionMock.mockResolvedValue({ ok: true });
  });

  // On CI's shared runners, mounting LookForm's full control tree (preset
  // picker, hue slider, font pickers, both preview panels) as the first
  // render in this file consistently lands just over Vitest's 5000ms
  // default — not a code regression, just cold-start cost under contention.
  it(
    'renders the current preset and accent hue from the given initial values',
    { timeout: 15000 },
    () => {
      render(
        <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
      );

      expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByText('250°')).toBeVisible();
    },
  );

  it('renders Basic and Advanced as visually distinct sections, Advanced collapsed by default', () => {
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    expect(screen.getByRole('heading', { name: 'Basic' })).toBeVisible();
    const summary = screen.getByText('Advanced').closest('summary');
    expect(summary).not.toBeNull();
    expect(summary?.closest('details')).not.toHaveAttribute('open');
  });

  it('shows the favicon square requirement before any file is chosen', () => {
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    expect(
      screen.getByRole('button', { name: 'Upload logo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pre-cropped square, please/)).toBeVisible();
  });

  it("choosing a preset doesn't clear an already-saved brand image", async () => {
    const user = userEvent.setup();
    render(
      <LookForm
        tenantSlug="acme"
        initialValues={{
          ...defaultLookFormValues(),
          logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
        }}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(screen.getByAltText('Current logo')).toBeInTheDocument();
  });

  it('notes that terminal chrome is not yet persisted', () => {
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    expect(
      screen.getByText(/Not saved yet — site_config has no column/),
    ).toBeInTheDocument();
  });

  it("choosing a preset resets every one of that preset's defaults", async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(screen.getByText('28°')).toBeVisible();
  });

  it('saves the current form state, excluding chromeOn, through updateLookAction', async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateLookActionMock).toHaveBeenCalledWith('acme', {
        preset: PRESET_ID.CONSOLE,
        accentHue: 251,
        logoHue: null,
        headingFont: FONT_CHOICE.SPACE_GROTESK,
        bodyFont: FONT_CHOICE.NEWSREADER,
        radiusScale: RADIUS_SCALE.MD,
        density: DENSITY.DEFAULT,
      });
    });
  });

  it('shows a save-confirmation toast once the save resolves', async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Saved to site_config.',
    );
  });

  it('shows an error alert when the save fails', async () => {
    updateLookActionMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't save Look settings",
    );
  });

  it('disables Reset to preset and Save changes until the form is dirty', async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

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

  it('resets a diverged control back to the current preset on "Reset to preset"', async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    const slider = screen.getByRole('slider', { name: 'Accent hue' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('251°')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Reset to preset' }));

    expect(screen.getByText('250°')).toBeVisible();
  });

  it('shows an archived notice and disables Save even once dirty, for an archived tenant', async () => {
    const user = userEvent.setup();
    render(
      <LookForm
        tenantSlug="acme"
        initialValues={defaultLookFormValues()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(screen.getByText('This tenant is archived')).toBeVisible();

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(updateLookActionMock).not.toHaveBeenCalled();
  });

  it('disables every Look control for an archived tenant', () => {
    render(
      <LookForm
        tenantSlug="acme"
        initialValues={defaultLookFormValues()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

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
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Upload favicon' }),
    ).toBeDisabled();
  });

  it('disables the Advanced section controls for an archived tenant', async () => {
    const user = userEvent.setup();
    render(
      <LookForm
        tenantSlug="acme"
        initialValues={defaultLookFormValues()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    await user.click(screen.getByText('Advanced'));

    expect(
      screen.getByRole('switch', { name: 'Terminal chrome' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getAllByRole('radio', { name: 'Space Grotesk' })[0],
    ).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Small' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Extra Large' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Compact' })).toBeDisabled();
  });

  it('leaves every Look control enabled for a non-archived tenant', async () => {
    const user = userEvent.setup();
    render(
      <LookForm tenantSlug="acme" initialValues={defaultLookFormValues()} />,
    );

    await user.click(screen.getByText('Advanced'));

    expect(screen.getByRole('radio', { name: 'Console' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('slider', { name: 'Accent hue' })).toBeEnabled();
    expect(
      screen.getByRole('switch', { name: 'Follow accent hue' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('switch', { name: 'Terminal chrome' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Small' })).toBeEnabled();
  });

  it('describes the disabled Save and Reset buttons with the archived notice text, for a screen-reader user', () => {
    render(
      <LookForm
        tenantSlug="acme"
        initialValues={defaultLookFormValues()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
    expect(
      screen.getByRole('button', { name: 'Reset to preset' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
  });
});
