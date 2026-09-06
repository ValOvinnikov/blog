import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { CSSProperties } from 'react';

import { PreviewSample } from './preview-sample';

const render = renderWithIntl;

const BASE_PROPS = {
  tenantName: 'Acme Inc.',
  tokenStyle: {
    '--brand-primary': 'oklch(0.53 0.17 250)',
  } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-space-grotesk-font-family',
  bodyFontFamily: 'mock-newsreader-font-family',
};

describe(PreviewSample, () => {
  it('renders the tenant name and a @blog/ui Button primitive', () => {
    render(<PreviewSample {...BASE_PROPS} />);

    expect(screen.getAllByText('Acme Inc.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('applies the given token style to its root, ancestor of the sample content', () => {
    render(<PreviewSample {...BASE_PROPS} />);

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button.closest('[style*="--brand-primary"]')).not.toBeNull();
  });

  it('keeps the Panel surface visible — a regression guard against a caller class stripping its border/background', () => {
    render(<PreviewSample {...BASE_PROPS} />);

    expect(screen.getByTestId('preview-sample-panel')).toHaveClass(
      'rounded-md',
      'border-border',
      'bg-surface',
    );
  });
});
