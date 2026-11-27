import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_FULLSCREEN as LOOK_FULLSCREEN_LIMIT } from '@platform/constants/look-fullscreen';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  PREVIEW_FRAME_STATUS_TEST_ID,
} from '@platform/constants/preview';
import messages from '@platform/i18n/messages/en.json';
import { act, screen, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  PREVIEW_DARK_LABEL,
  PREVIEW_TABLET_LABEL,
  tDevicePreview,
} from '@platform/testing/look/look-preview-labels';
import {
  renderPreview,
  setPreviewDevice,
} from '@platform/testing/look/look-preview-render';
import {
  stubChangingMediaQueries,
  stubLgUpWindow,
} from '@platform/testing/match-media';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPreview } from './look-preview';

const LOOK_PREVIEW = messages.lookPreview;
const LOOK_FOLLOW = messages.lookFollow;
const LOOK_FULLSCREEN = messages.lookFullscreen;
const DESKTOP = tDevicePreview('deviceDesktop');
const DESKTOP_WIDTH = PREVIEW_DEVICE_WIDTH[PREVIEW_DEVICE.DESKTOP];
const LIVE_PREVIEW = messages.previewModeControl.livePreviewHeading;

describe(`<${LookPreview.name}/> full screen`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('with the preview rendered', () => {
    beforeEach(() => {
      renderPreview();
    });

    it('puts Open preview full screen with Follow, outside the toolbar, on the phone tab', () => {
      const toolbar = screen.getByRole('toolbar');
      const follow = screen.getByRole('button', {
        name: LOOK_FOLLOW.followToggle,
      });

      expect(toolbar).not.toContainElement(openButton());
      expect(toolbar).not.toContainElement(follow);
    });

    it('reads the short readout below lg', async () => {
      await user.click(openButton());

      const readout = within(dialog()).getByText(
        readoutText('readoutPhoneTab'),
      );

      expect(readout).toHaveRole('status');
    });
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
      expect(openButton()).not.toHaveAttribute(ARIA_ATTRIBUTE.PRESSED);
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
        expect(dialog()).toHaveAttribute(ARIA_ATTRIBUTE.MODAL, 'true');
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
        const readout = within(dialog()).getByText(readoutText('readoutLong'));

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
        await user.click(inDialog(PREVIEW_TABLET_LABEL));

        expect(setPreviewDevice).toHaveBeenCalledWith(PREVIEW_DEVICE.TABLET);
      });

      it('keeps a colour scheme picked inside once closed by Close', async () => {
        await user.click(inDialog(PREVIEW_DARK_LABEL));
        await user.click(inDialog(LOOK_FULLSCREEN.close));

        const pageDark = screen.getByRole('button', {
          name: PREVIEW_DARK_LABEL,
        });
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
