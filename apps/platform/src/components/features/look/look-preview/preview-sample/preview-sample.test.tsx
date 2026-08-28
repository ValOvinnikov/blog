import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { CSSProperties } from 'react';

import { PreviewSample } from './preview-sample';

const render = renderWithIntl;

const BASE_PROPS = {
  tenantSlug: 'acme',
  tokenStyle: {
    '--brand-primary': 'oklch(0.53 0.17 250)',
  } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-space-grotesk-font-family',
  bodyFontFamily: 'mock-newsreader-font-family',
  isChromeOn: false,
};

describe(PreviewSample, () => {
  it('renders the tenant slug and a @blog/ui Button primitive', () => {
    render(<PreviewSample {...BASE_PROPS} />);

    expect(screen.getAllByText('acme').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('applies the given token style to its root, ancestor of the sample content', () => {
    render(<PreviewSample {...BASE_PROPS} />);

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button.closest('[style*="--brand-primary"]')).not.toBeNull();
  });

  it('shows no terminal chrome bar when isChromeOn is false', () => {
    render(<PreviewSample {...BASE_PROPS} isChromeOn={false} />);

    expect(screen.queryByText('~$ ./publish')).not.toBeInTheDocument();
  });

  it('shows the terminal chrome bar when isChromeOn is true', () => {
    render(<PreviewSample {...BASE_PROPS} isChromeOn={true} />);

    expect(screen.getByText('~$ ./publish')).toBeVisible();
  });
});
