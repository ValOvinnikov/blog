import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import type { CSSProperties } from 'react';

import { LookSample } from './look-sample';

const render = renderWithIntl;

const STATIC_ITEM_TITLE = 'Charting the next season';
const CURRENT_CODE_TEST_ID = 'sample-language-code-current';
const LANGUAGE_MENU = 'Language: English';
const TENANT_ACCENT = 'oklch(0.7 0.16 28)';

const BASE_PROPS = {
  tenantName: MOCK_TENANT_NAME,
  logoSrc: undefined,
  theme: MOCK_SITE_PREVIEW_THEME,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  hasReaderAccounts: true,
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

  describe('with the default values', () => {
    beforeEach(() => {
      render(<LookSample {...BASE_PROPS} />);
    });

    it('renders the tenant name and a @blog/ui Button primitive', () => {
      expect(screen.getAllByText(MOCK_TENANT_NAME).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
    });

    it('keeps the sample out of the tab order and the page outline', () => {
      expect(screen.getByTestId('look-sample-tokens')).toHaveAttribute('inert');
    });

    it('renders one linked and one static item card beside an outlined card', () => {
      expect(
        screen.getByRole('link', { name: 'Notes from the harbour' }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', {
          level: 4,
          name: STATIC_ITEM_TITLE,
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole('link', { name: STATIC_ITEM_TITLE }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 4, name: 'Newsletter' }),
      ).toBeVisible();
    });

    it('opens with a header carrying the brand and two nav links', () => {
      expect(screen.getByRole('banner')).toHaveTextContent(MOCK_TENANT_NAME);
      expect(screen.getByRole('link', { name: 'Posts' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'About' })).toBeVisible();
    });

    it('shows the theme toggle and a Sign in pill when the site has reader accounts', () => {
      expect(
        screen.getByRole('button', { name: 'Switch to dark theme' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveTextContent(
        'Sign in',
      );
    });

    it('shows every live language as a code with compact codes', () => {
      const current = screen.getByTestId(CURRENT_CODE_TEST_ID);
      expect(current).toHaveAttribute('aria-current', 'page');
      expect(current).toHaveTextContent('English');
      expect(
        screen.queryByRole('link', { name: 'English' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Français' })).toHaveTextContent(
        LOCALE_ISO_CODES.FR,
      );
      expect(
        screen.queryByRole('button', { name: LANGUAGE_MENU }),
      ).not.toBeInTheDocument();
    });
  });

  it('resolves the tenant accent rather than the static dark ramp in dark mode', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        theme={{
          ...MOCK_SITE_PREVIEW_THEME,
          isDark: true,
          tokenStyle: {
            '--brand-primary': TENANT_ACCENT,
          } as CSSProperties,
        }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(getComputedStyle(button).getPropertyValue('--brand-primary')).toBe(
      TENANT_ACCENT,
    );
  });

  it('renders the uploaded logo in place of the generated mark', () => {
    render(
      <LookSample {...BASE_PROPS} logoSrc="https://cdn.example.com/logo.svg" />,
    );

    expect(screen.getByRole('img', { name: MOCK_TENANT_NAME })).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.svg',
    );
  });

  it('offers the light theme from a dark preview', () => {
    render(
      <LookSample
        {...BASE_PROPS}
        theme={{ ...MOCK_SITE_PREVIEW_THEME, isDark: true }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeVisible();
  });

  it('shows no Sign in when the site has no reader accounts', () => {
    render(<LookSample {...BASE_PROPS} hasReaderAccounts={false} />);

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  it('shows the brand, the person circle and the menu button on a narrow preview', () => {
    render(<LookSample {...BASE_PROPS} isNarrow={true} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent(MOCK_TENANT_NAME);
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveTextContent(
      '',
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Posts' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId(CURRENT_CODE_TEST_ID)).not.toBeInTheDocument();
  });

  it('keeps the narrow bar to the brand and the menu button without reader accounts', () => {
    render(
      <LookSample {...BASE_PROPS} isNarrow={true} hasReaderAccounts={false} />,
    );

    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
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
      screen.getByRole('button', { name: LANGUAGE_MENU }),
    ).toHaveTextContent(LOCALE_ISO_CODES.EN);
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
      screen.getByRole('button', { name: LANGUAGE_MENU }),
    ).not.toHaveTextContent(LOCALE_ISO_CODES.EN);
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
      screen.getByRole('button', { name: LANGUAGE_MENU }),
    ).toHaveTextContent(LOCALE_ISO_CODES.EN);
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
