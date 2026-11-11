import {
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  RADIUS_SCALE,
} from '@blog/config';
import { DEVICE_FRAME_TEST_ID } from '@platform/constants/device-frame';
import { LOOK_FULLSCREEN as LOOK_FULLSCREEN_LIMIT } from '@platform/constants/look-fullscreen';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  PREVIEW_FRAME_STATUS_TEST_ID,
} from '@platform/constants/preview';
import { SAMPLE_COOKIE_BUTTON_TEST_ID } from '@platform/constants/sample-footer';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { act, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  CARD_RADIUS_TOKEN,
  FOOTER_TARGET,
  followLine,
  mockOpenRowTarget,
} from '@platform/testing/look/look-follow';
import { CONSOLE } from '@platform/testing/look/look-form-fixtures';
import {
  renderPreview,
  setPreviewDevice,
} from '@platform/testing/look/look-preview-render';
import {
  stubChangingMediaQueries,
  stubLgUpWindow,
} from '@platform/testing/match-media';
import { MOCK_TENANT_DOMAIN } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const MOCK_ACCENT_HUE = 28;
const LOOK_PREVIEW = messages.lookPreview;
const LOOK_FOLLOW = messages.lookFollow;
const LOOK_FULLSCREEN = messages.lookFullscreen;
const STYLE_TARGET = mockOpenRowTarget(LOOK_ROW.TYPE);
const FREE_SAMPLE_NOTE = followLine('freeSample', {
  preset: CONSOLE,
});
const tDevicePreview = makeEnTranslator('devicePreview');
const TABLET = tDevicePreview('deviceTablet');
const DESKTOP = tDevicePreview('deviceDesktop');
const DESKTOP_WIDTH = PREVIEW_DEVICE_WIDTH[PREVIEW_DEVICE.DESKTOP];
const DARK = messages.previewModeControl.modeDark;
const LIVE_PREVIEW = messages.previewModeControl.livePreviewHeading;

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
        '--item-accent-color': 'var(--border)',
      },
    },
  ])('carries $name onto the preview surface', ({ values, tokens }) => {
    renderPreview({ values });

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle(tokens);
  });

  it('hands a picked device to the Look form', async () => {
    renderPreview();

    const tabletButton = screen.getByRole('button', { name: TABLET });
    await user.click(tabletButton);

    expect(setPreviewDevice).toHaveBeenCalledWith(PREVIEW_DEVICE.TABLET);
  });

  it('shows the site host in the desktop browser bar', () => {
    renderPreview();

    const browserBar = screen.getByTestId(DEVICE_FRAME_TEST_ID.BROWSER_BAR);

    expect(browserBar).toHaveTextContent(MOCK_TENANT_DOMAIN);
  });

  it('offers the reader switch when reader accounts are on', () => {
    renderPreview();

    const readerGroup = screen.getByRole('group', {
      name: LOOK_PREVIEW.readerStateAriaLabel,
    });
    const statusText = screen.getByTestId(PREVIEW_FRAME_STATUS_TEST_ID);

    expect(readerGroup).toBeVisible();
    expect(statusText).not.toHaveTextContent(LOOK_PREVIEW.readerAccountsOff);
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

    const darkButton = screen.getByRole('button', { name: DARK });
    await user.click(darkButton);

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

    expect(sampleTokens).toHaveStyle({
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
    });
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

  describe('full screen', () => {
    const openButton = () =>
      screen.getByRole('button', { name: LOOK_FULLSCREEN.open });
    const dialog = () => screen.getByRole('dialog', { name: LIVE_PREVIEW });
    const inDialog = (name: string) =>
      within(dialog()).getByRole('button', { name });
    const STAGE_NAME = tDevicePreview('sampleAtWidth', {
      width: DESKTOP_WIDTH,
    });
    const readoutText = (key: string) =>
      tDevicePreview(key, { width: DESKTOP_WIDTH, percent: 100 });

    it('puts Open preview full screen with Follow, outside the toolbar, on the phone tab', () => {
      renderPreview();

      const toolbar = screen.getByRole('toolbar');
      const follow = screen.getByRole('button', {
        name: LOOK_FOLLOW.followToggle,
      });

      expect(toolbar).not.toContainElement(openButton());
      expect(toolbar).not.toContainElement(follow);
    });

    it('reads the short readout below lg', async () => {
      renderPreview();
      await user.click(openButton());

      const readout = within(dialog()).getByText(
        readoutText('readoutPhoneTab'),
      );

      expect(readout).toHaveRole('status');
    });

    it('returns focus to Open preview full screen after the window crosses lg', async () => {
      const resizeTo = stubChangingMediaQueries([MEDIA_QUERY.LG_UP]);
      renderPreview();
      await user.click(openButton());

      resizeTo([]);
      await user.click(inDialog(LOOK_FULLSCREEN.close));

      expect(openButton()).toHaveFocus();
    });

    describe('from lg', () => {
      beforeEach(() => {
        stubLgUpWindow();
        renderPreview();
      });

      it('puts Open preview full screen last in the toolbar, with no pressed state', () => {
        const toolbarButtons = within(screen.getByRole('toolbar')).getAllByRole(
          'button',
        );

        expect(toolbarButtons.at(-1)).toBe(openButton());
        expect(openButton()).not.toHaveAttribute(ARIA_PRESSED);
      });

      it('shows the pressed device tooltip at once when opened from the keyboard', async () => {
        act(() => openButton().focus());
        await user.keyboard(USER_EVENT_KEY.ENTER);

        const tooltip = await screen.findByText(
          tDevicePreview('tooltipDesktop', { width: DESKTOP_WIDTH }),
        );

        expect(inDialog(DESKTOP)).toHaveFocus();
        expect(tooltip).toBeInTheDocument();
      });

      describe('once opened', () => {
        beforeEach(async () => {
          await user.click(openButton());
        });

        it('opens a modal dialog named Live preview', () => {
          expect(dialog()).toHaveAttribute('aria-modal', 'true');
        });

        it('moves focus to the pressed device button', () => {
          expect(inDialog(DESKTOP)).toHaveFocus();
        });

        it('names the stage region by the device width, once', () => {
          const region = within(dialog()).getByRole('region', {
            name: STAGE_NAME,
          });
          const image = within(dialog()).queryByRole('img', {
            name: STAGE_NAME,
          });

          expect(region).toHaveAttribute('tabindex', '0');
          expect(image).not.toBeInTheDocument();
        });

        it('leaves Follow and the status line out', () => {
          const follow = within(dialog()).queryByRole('button', {
            name: LOOK_FOLLOW.followToggle,
          });
          const status = within(dialog()).queryByTestId(
            PREVIEW_FRAME_STATUS_TEST_ID,
          );

          expect(follow).not.toBeInTheDocument();
          expect(status).not.toBeInTheDocument();
        });

        it('offers the reader switch', () => {
          const readerGroup = within(dialog()).getByRole('group', {
            name: LOOK_PREVIEW.readerStateAriaLabel,
          });

          expect(readerGroup).toBeVisible();
        });

        it('reads the long readout as a live region', () => {
          const readout = within(dialog()).getByText(
            readoutText('readoutLong'),
          );

          expect(readout).toHaveRole('status');
        });

        describe('with the stage focused', () => {
          let scrollBy: ReturnType<typeof vi.fn>;

          beforeEach(() => {
            scrollBy = vi.fn();
            Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
              configurable: true,
              value: scrollBy,
            });
            const region = within(dialog()).getByRole('region', {
              name: STAGE_NAME,
            });
            act(() => region.focus());
          });

          afterEach(() => {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
          });

          it('scrolls the frame with the arrow keys', async () => {
            await user.keyboard(USER_EVENT_KEY.ARROW_DOWN);
            await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);

            expect(scrollBy).toHaveBeenNthCalledWith(1, {
              top: LOOK_FULLSCREEN_LIMIT.SCROLL_STEP,
            });
            expect(scrollBy).toHaveBeenNthCalledWith(2, {
              left: LOOK_FULLSCREEN_LIMIT.SCROLL_STEP,
            });
          });
        });

        it('hands a device picked inside to the Look form', async () => {
          await user.click(inDialog(TABLET));

          expect(setPreviewDevice).toHaveBeenCalledWith(PREVIEW_DEVICE.TABLET);
        });

        it('keeps a colour scheme picked inside once closed by Close', async () => {
          await user.click(inDialog(DARK));
          await user.click(inDialog(LOOK_FULLSCREEN.close));

          const pageDark = screen.getByRole('button', { name: DARK });
          const closedDialog = screen.queryByRole('dialog');

          expect(closedDialog).not.toBeInTheDocument();
          expect(pageDark).toBePressed();
          expect(openButton()).toHaveFocus();
        });

        it('closes on one Escape and returns focus to Open preview full screen', async () => {
          await user.keyboard(USER_EVENT_KEY.ESCAPE);
          const closedDialog = screen.queryByRole('dialog');

          expect(closedDialog).not.toBeInTheDocument();
          expect(openButton()).toHaveFocus();
        });
      });
    });
  });
});
