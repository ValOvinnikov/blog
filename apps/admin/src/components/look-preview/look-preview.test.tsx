import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { FONT_CHOICE } from '@blog/config';
import userEvent from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const render = renderWithIntl;

const BASE_PROPS = {
  tenantSlug: 'acme',
  accentHue: 250,
  logoHue: undefined,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  chromeOn: false,
};

describe(LookPreview, () => {
  it('renders the tenant slug, a heading sample, and a @blog/ui Button primitive', () => {
    render(<LookPreview {...BASE_PROPS} />);

    expect(screen.getAllByText('acme').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('applies the accent hue as a live CSS custom property on the preview surface', () => {
    render(<LookPreview {...BASE_PROPS} accentHue={28} />);

    const button = screen.getByRole('button', { name: 'Subscribe' });
    const previewSurface = button.closest('[style*="--brand-primary"]');

    expect(previewSurface).not.toBeNull();
    expect(previewSurface).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.55 0.17 28)',
    });
  });

  it('shows no terminal chrome bar when chromeOn is false', () => {
    render(<LookPreview {...BASE_PROPS} chromeOn={false} />);

    expect(screen.queryByText('~$ ./publish')).not.toBeInTheDocument();
  });

  it('shows the terminal chrome bar when chromeOn is true', () => {
    render(<LookPreview {...BASE_PROPS} chromeOn={true} />);

    expect(screen.getByText('~$ ./publish')).toBeVisible();
  });

  it('reserves a full-page preview panel naming the deferred iframe mechanism', () => {
    render(<LookPreview {...BASE_PROPS} />);

    expect(screen.getByText('Full-page preview')).toBeVisible();
    expect(screen.getByText('preview.acme.dev')).toBeVisible();
  });

  it('re-derives the swatch color when the preview mode toggles to dark, independent of preset', async () => {
    const user = userEvent.setup();
    render(<LookPreview {...BASE_PROPS} accentHue={28} />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    const button = screen.getByRole('button', { name: 'Subscribe' });
    const previewSurface = button.closest('[style*="--brand-primary"]');

    expect(previewSurface).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });
});
