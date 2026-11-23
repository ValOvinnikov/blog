import { DEVICE_FRAME_TEST_ID } from '@platform/constants/device-frame';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  PREVIEW_DEVICE,
  PREVIEW_FRAME_STATUS_TEST_ID,
} from '@platform/constants/preview';
import { SAMPLE_COOKIE_BUTTON_TEST_ID } from '@platform/constants/sample-footer';
import { SAMPLE_HEADER_FULL_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  CARD_RADIUS_TOKEN,
  FOOTER_TARGET,
  followLine,
  mockOpenRowTarget,
} from '@platform/testing/look/look-follow';
import { CONSOLE } from '@platform/testing/look/look-form-fixtures';
import {
  PREVIEW_DARK_LABEL,
  PREVIEW_TABLET_LABEL,
} from '@platform/testing/look/look-preview-labels';
import {
  renderPreview,
  setPreviewDevice,
} from '@platform/testing/look/look-preview-render';
import {
  MOCK_LOGO_DARK_URL,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  RADIUS_SCALE,
} from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const MOCK_ACCENT_HUE = 28;
const LOOK_PREVIEW = messages.lookPreview;
const STYLE_TARGET = mockOpenRowTarget(LOOK_ROW.TYPE);
const FREE_SAMPLE_NOTE = followLine('freeSample', {
  preset: CONSOLE,
});

describe(`<${LookPreview.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      name: 'the accent hue',
      values: { accentHue: MOCK_ACCENT_HUE },
      tokens: { '--brand-primary-solid': 'oklch(0.51 0.17 28)' },
    },
    {
      name: 'the radius scale and density',
      values: { radiusScale: RADIUS_SCALE.XL, density: DENSITY.COMPACT },
      tokens: { [CARD_RADIUS_TOKEN]: '16px', '--spacing-card-x': '0.75rem' },
    },
    {
      name: 'the outlined card style',
      values: { cardStyle: CARD_STYLE.OUTLINED },
      tokens: {
        '--item-border-width': '1px',
        '--item-accent-brand-share': '0%',
      },
    },
  ])('carries $name onto the preview surface', ({ values, tokens }) => {
    renderPreview({ values });

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle(tokens);
  });

  describe('with the default preview', () => {
    beforeEach(() => {
      renderPreview();
    });

    it('hands a picked device to the Look form', async () => {
      const tabletButton = screen.getByRole('button', {
        name: PREVIEW_TABLET_LABEL,
      });
      await user.click(tabletButton);

      expect(setPreviewDevice).toHaveBeenCalledWith(PREVIEW_DEVICE.TABLET);
    });

    it('shows the site host in the desktop browser bar', () => {
      const browserBar = screen.getByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

      expect(browserBar).toHaveTextContent(MOCK_TENANT_DOMAIN);
    });

    it('offers the reader switch when reader accounts are on', () => {
      const readerGroup = screen.getByRole('group', {
        name: LOOK_PREVIEW.readerStateAriaLabel,
      });
      const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

      expect(readerGroup).toBeVisible();
      expect(statusText).not.toHaveTextContent(LOOK_PREVIEW.readerAccountsOff);
    });
  });

  it('explains the missing reader switch when reader accounts are off', () => {
    renderPreview({ hasReaderAccounts: false });

    const readerGroup = screen.queryByRole('group', {
      name: LOOK_PREVIEW.readerStateAriaLabel,
    });
    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(readerGroup).not.toBeInTheDocument();
    expect(statusText).toHaveTextContent(LOOK_PREVIEW.readerAccountsOff);
  });

  it('leaves My bookmarks out of the signed-in sample with Bookmarks off', async () => {
    renderPreview({ hasBookmarks: false });
    const signedInButton = screen.getByRole('button', {
      name: LOOK_PREVIEW.readerSignedIn,
    });
    await user.click(signedInButton);

    const fullHeader = screen.getByTestId(SAMPLE_HEADER_FULL_TEST_ID);
    const accountMenu = within(fullHeader).getByRole('menu', {
      name: LOOK_PREVIEW.accountMenuAriaLabel,
    });
    const bookmarks = within(accountMenu).queryByText(LOOK_PREVIEW.myBookmarks);

    expect(bookmarks).not.toBeInTheDocument();
  });

  it.each([
    { target: STYLE_TARGET, hasLockedFields: false },
    { target: FOOTER_TARGET, hasLockedFields: true },
  ])(
    'leaves the Free note off a $target.row line, locked fields $hasLockedFields',
    ({ target, hasLockedFields }) => {
      renderPreview({ followTarget: target, hasLockedFields });

      const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

      expect(statusText).not.toHaveTextContent(FREE_SAMPLE_NOTE);
    },
  );

  it('adds the Free sample note after a Style card line on a Free site', () => {
    renderPreview({ followTarget: STYLE_TARGET, hasLockedFields: true });

    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(statusText).toHaveTextContent(
      `${followLine('styleCard', { card: messages.lookForm.typeHeading })} ${FREE_SAMPLE_NOTE}`,
    );
  });

  it('re-derives the accent tokens for the dark preview mode', async () => {
    renderPreview({ values: { accentHue: MOCK_ACCENT_HUE } });

    const darkButton = screen.getByRole('button', { name: PREVIEW_DARK_LABEL });
    await user.click(darkButton);

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
  });

  describe('brand logo', () => {
    const sampleLogos = () =>
      screen.getAllByRole('img', { name: MOCK_TENANT_NAME });

    it.each([
      {
        scheme: 'light',
        isDark: false,
        logoDark: MOCK_LOGO_DARK_URL,
        shown: MOCK_LOGO_URL,
      },
      {
        scheme: 'dark',
        isDark: true,
        logoDark: MOCK_LOGO_DARK_URL,
        shown: MOCK_LOGO_DARK_URL,
      },
      {
        scheme: 'dark, with no dark-mode logo,',
        isDark: true,
        logoDark: undefined,
        shown: MOCK_LOGO_URL,
      },
    ])(
      'shows $shown in the $scheme preview',
      async ({ isDark, logoDark, shown }) => {
        renderPreview({
          values: { logo: { url: MOCK_LOGO_URL }, logoDark: { url: logoDark } },
        });

        if (isDark) {
          const darkButton = screen.getByRole('button', {
            name: PREVIEW_DARK_LABEL,
          });
          await user.click(darkButton);
        }

        sampleLogos().forEach((logo) => {
          expect(logo).toHaveAttribute('src', shown);
        });
      },
    );
  });

  describe('cookie settings', () => {
    const cookieButton = () =>
      screen.queryByTestId(SAMPLE_COOKIE_BUTTON_TEST_ID);
    const cookieSettingsLink = () =>
      screen.queryByRole('link', { name: LOOK_PREVIEW.footerCookieSettings });

    it('floats the cookie button over the sample, outside the page', () => {
      renderPreview({
        values: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
      });

      const content = screen.getByTestId(DEVICE_FRAME_TEST_ID.CONTENT);

      expect(cookieButton()).toBeInTheDocument();
      expect(content).not.toContainElement(cookieButton());
    });

    it.each([
      [COOKIE_SETTINGS_BUTTON.HIDDEN, true, false],
      [COOKIE_SETTINGS_BUTTON.ONLY, false, true],
      [COOKIE_SETTINGS_BUTTON.SHOWN, true, true],
    ])(
      'with %s chosen, shows the footer link: %s, the floating button: %s',
      (cookieSettingsButton, hasLink, hasButton) => {
        renderPreview({ values: { cookieSettingsButton } });

        expect(Boolean(cookieSettingsLink())).toBe(hasLink);
        expect(Boolean(cookieButton())).toBe(hasButton);
      },
    );

    it('shows neither the link nor the button while the cookie banner is off', () => {
      renderPreview({
        values: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
        hasCookieBanner: false,
      });

      expect(cookieSettingsLink()).not.toBeInTheDocument();
      expect(cookieButton()).not.toBeInTheDocument();
    });
  });
});
