import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
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
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
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

  it('opens with a header carrying the brand and two nav links', () => {
    render(<LookSample {...BASE_PROPS} />);

    expect(screen.getByRole('banner')).toHaveTextContent('Acme Inc.');
    expect(screen.getByRole('link', { name: 'Posts' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'About' })).toBeVisible();
  });

  it('shows every live language as a code with compact codes', () => {
    render(<LookSample {...BASE_PROPS} />);

    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Français' })).toHaveTextContent(
      'FR',
    );
    expect(
      screen.queryByRole('button', { name: 'Language: English' }),
    ).not.toBeInTheDocument();
  });

  it('shows a menu pill with the current code for menu with code', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        languageSwitcherStyle={LANGUAGE_SWITCHER_STYLE.MENU_CODE}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Language: English' }),
    ).toHaveTextContent('EN');
    expect(
      screen.queryByRole('link', { name: 'Français' }),
    ).not.toBeInTheDocument();
  });

  it('shows a globe menu without a code for menu with globe', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        languageSwitcherStyle={LANGUAGE_SWITCHER_STYLE.MENU_GLOBE}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Language: English' }),
    ).not.toHaveTextContent('EN');
  });

  it('falls back to the code menu when compact codes would show more than four languages', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        liveLocales={[
          LOCALE_ISO_CODES.EN,
          LOCALE_ISO_CODES.FR,
          LOCALE_ISO_CODES.DE,
          LOCALE_ISO_CODES.ES,
          LOCALE_ISO_CODES.NL,
        ]}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Language: English' }),
    ).toHaveTextContent('EN');
  });

  it('shows no switcher with one live language', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        liveLocales={[LOCALE_ISO_CODES.EN]}
        languageSwitcherStyle={LANGUAGE_SWITCHER_STYLE.MENU_GLOBE}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /^Language/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'English' }),
    ).not.toBeInTheDocument();
  });
});
