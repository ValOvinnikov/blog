import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { CSSProperties } from 'react';

import { LookSample } from './look-sample';

const render = renderWithIntl;

const BASE_PROPS = {
  tenantName: 'Acme Inc.',
  logoSrc: undefined,
  tokenStyle: {
    '--brand-primary': 'oklch(0.53 0.17 28)',
  } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-space-grotesk-font-family',
  bodyFontFamily: 'mock-newsreader-font-family',
};

describe(LookSample, () => {
  let staticDarkRamp: HTMLStyleElement;

  beforeEach(() => {
    staticDarkRamp = document.createElement('style');
    staticDarkRamp.textContent =
      '.dark { --brand-primary: oklch(0.7 0.16 250); }';
    document.head.append(staticDarkRamp);
  });

  afterEach(() => {
    staticDarkRamp.remove();
  });

  it('renders the tenant name and a @blog/ui Button primitive', () => {
    render(<LookSample {...BASE_PROPS} />);

    expect(screen.getAllByText('Acme Inc.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('keeps the sample out of the tab order and the page outline', () => {
    render(<LookSample {...BASE_PROPS} />);

    expect(screen.getByTestId('look-sample-tokens')).toHaveAttribute('inert');
  });

  it('resolves the tenant accent rather than the static dark ramp in dark mode', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        isDark={true}
        tokenStyle={
          { '--brand-primary': 'oklch(0.7 0.16 28)' } as CSSProperties
        }
      />,
    );

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(getComputedStyle(button).getPropertyValue('--brand-primary')).toBe(
      'oklch(0.7 0.16 28)',
    );
  });

  it('renders the uploaded logo in place of the generated mark', () => {
    render(
      <LookSample {...BASE_PROPS} logoSrc="https://cdn.example.com/logo.svg" />,
    );

    expect(screen.getByRole('img', { name: 'Acme Inc.' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.svg',
    );
  });

  it('renders one linked and one static item card beside an outlined card', () => {
    render(<LookSample {...BASE_PROPS} />);

    expect(
      screen.getByRole('link', { name: 'Notes from the harbour' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Charting the next season',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Charting the next season' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 4, name: 'Newsletter' }),
    ).toBeVisible();
  });
});
