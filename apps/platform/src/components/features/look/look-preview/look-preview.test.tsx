import { CARD_STYLE, DENSITY, FONT_CHOICE, RADIUS_SCALE } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const render = renderWithIntl;

const BASE_PROPS = {
  tenantName: 'Acme Inc.',
  accentHue: 250,
  logoHue: undefined,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  logoSrc: undefined,
};

describe(LookPreview, () => {
  it('renders the tenant name and a real site Button primitive from the preview sample', () => {
    render(<LookPreview {...BASE_PROPS} />);

    expect(screen.getAllByText('Acme Inc.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('applies the accent hue as a live CSS custom property on the preview surface', () => {
    render(<LookPreview {...BASE_PROPS} accentHue={28} />);

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.55 0.17 28)',
    });
  });

  it('carries the radius scale and density onto the preview surface', () => {
    render(
      <LookPreview
        {...BASE_PROPS}
        radiusScale={RADIUS_SCALE.XL}
        density={DENSITY.COMPACT}
      />,
    );

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--radius-md': '12px',
      '--spacing-card-x': '0.75rem',
    });
  });

  it('carries the outlined card style onto the preview surface', () => {
    render(<LookPreview {...BASE_PROPS} cardStyle={CARD_STYLE.OUTLINED} />);

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--item-border-width': '1px',
      '--item-accent-color': 'var(--border)',
    });
  });

  it('switches the preview between desktop and mobile widths', async () => {
    const user = userEvent.setup();
    render(<LookPreview {...BASE_PROPS} />);

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
    render(<LookPreview {...BASE_PROPS} accentHue={28} />);

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByTestId('preview-sample-tokens')).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });
});
