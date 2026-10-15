import {
  CARD_STYLE,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  RADIUS_SCALE,
} from '@blog/config';
import {
  LookFormProvider,
  type TLookFormContext,
} from '@platform/components/features/look/look-form-provider';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import userEvent from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const renderPreview = (values: Partial<TLookFormValues> = {}) => {
  const lookForm: TLookFormContext = {
    tenantName: 'Acme Inc.',
    values: {
      ...defaultLookFormValues(),
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      ...values,
    },
    updateField: vi.fn(),
    hasCardChanges: () => false,
    isDivergedFromPreset: false,
    isAccentHueRejected: false,
    accentHueFieldId: 'accent-hue',
    repickKinds: [],
    changePreset: vi.fn(),
    resetToPreset: vi.fn(),
  };

  return renderWithIntl(
    <LookFormProvider value={lookForm}>
      <LookPreview liveLocales={[LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR]} />
    </LookFormProvider>,
  );
};

describe(LookPreview, () => {
  it('renders the tenant name and a real site Button primitive from the preview sample', () => {
    renderPreview();

    expect(screen.getAllByText('Acme Inc.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('applies the accent hue as a live CSS custom property on the preview surface', () => {
    renderPreview({ accentHue: 28 });

    expect(screen.getByTestId('look-sample-tokens')).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.51 0.17 28)',
    });
  });

  it('carries the radius scale and density onto the preview surface', () => {
    renderPreview({
      radiusScale: RADIUS_SCALE.XL,
      density: DENSITY.COMPACT,
    });

    expect(screen.getByTestId('look-sample-tokens')).toHaveStyle({
      '--radius-md': '12px',
      '--spacing-card-x': '0.75rem',
    });
  });

  it('carries the outlined card style onto the preview surface', () => {
    renderPreview({ cardStyle: CARD_STYLE.OUTLINED });

    expect(screen.getByTestId('look-sample-tokens')).toHaveStyle({
      '--item-border-width': '1px',
      '--item-accent-color': 'var(--border)',
    });
  });

  it('switches the preview between desktop and mobile widths', async () => {
    const user = userEvent.setup();
    renderPreview();

    expect(screen.getByRole('button', { name: 'Desktop' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Mobile' }));

    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('re-derives the swatch color when the preview mode toggles to dark, independent of preset', async () => {
    const user = userEvent.setup();
    renderPreview({ accentHue: 28 });

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByTestId('look-sample-tokens')).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });
});
