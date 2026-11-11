import type { TLookFollowSettled } from '@platform/components/features/look/look-preview/follow-scroll';
import {
  LOOK_FOLLOW_OUTCOME,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import { PREVIEW_DEVICE } from '@platform/constants/preview';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  followLine,
  followStatusText,
  mockLookFollow,
  mockOpenRowTarget,
} from '@platform/testing/look/look-follow';
import { toLookFollowOutline } from '@platform/utils/look-follow-target/look-follow-target';
import userEvent from '@testing-library/user-event';

import { LookFollowStatus } from './look-follow-status';

const { lookForm: LOOK_FORM, lookFollow: LOOK_FOLLOW } = messages;
const FOOTER = LOOK_FORM.footerHeading;
const READER_NOTE = messages.lookPreview.readerAccountsOff;
const OVERFLOW = 120;
const FOOTER_TARGET = {
  kind: LOOK_FOLLOW_TARGET.PART,
  row: LOOK_ROW.FOOTER,
} as const;
const FOOTER_OUTLINE = toLookFollowOutline(FOOTER_TARGET);
const CARDS_TARGET = mockOpenRowTarget(LOOK_ROW.CARDS);
const CARDS_OUTLINE = toLookFollowOutline(CARDS_TARGET);
const AT_END: TLookFollowSettled = {
  outcome: LOOK_FOLLOW_OUTCOME.AT_END,
  overflow: 0,
};

const followingFooter = (settled = AT_END) =>
  mockLookFollow({ outline: FOOTER_OUTLINE, isFollowing: true, settled });

const setup = customRender(LookFollowStatus, {
  follow: mockLookFollow(),
  target: { kind: LOOK_FOLLOW_TARGET.IDLE },
  device: PREVIEW_DEVICE.DESKTOP,
  isShortLine: false,
  readerNote: undefined,
  planNote: undefined,
});

const topOfPageButton = () =>
  screen.queryByRole('button', { name: LOOK_FOLLOW.topOfPage });

describe(`<${LookFollowStatus.name}/>`, () => {
  it('asks for a Site parts card while every row is folded', () => {
    setup();

    expect(followStatusText()).toBe(LOOK_FOLLOW.idle);
  });

  it('asks for a Site parts card while some rows are open and none edited', () => {
    setup({ target: { kind: LOOK_FOLLOW_TARGET.UNEDITED } });

    expect(followStatusText()).toBe(LOOK_FOLLOW.idle);
  });

  it('asks for a focused card after Expand all', () => {
    setup({ target: { kind: LOOK_FOLLOW_TARGET.ALL_OPEN } });

    expect(followStatusText()).toBe(LOOK_FOLLOW.allOpen);
  });

  it('explains that a whole-page Style card holds the frame still', () => {
    setup({
      target: mockOpenRowTarget(LOOK_ROW.TYPE),
    });

    const line = followLine('styleCard', { card: LOOK_FORM.typeHeading });

    expect(followStatusText()).toBe(line);
  });

  it('names the Style card whose reach is outlined', () => {
    setup({
      target: CARDS_TARGET,
      follow: mockLookFollow({ outline: CARDS_OUTLINE, isFollowing: true }),
    });

    const line = followLine('styleOutlined', { card: LOOK_FORM.cardsHeading });

    expect(followStatusText()).toBe(line);
  });

  it('states the desktop overflow once a nearly fitting sample settles', () => {
    setup({
      target: FOOTER_TARGET,
      follow: followingFooter({
        outcome: LOOK_FOLLOW_OUTCOME.NEARLY_FITS,
        overflow: OVERFLOW,
      }),
    });

    const line = followLine('nearlyFits', { part: FOOTER, overflow: OVERFLOW });

    expect(followStatusText()).toBe(line);
  });

  it('names the device a fitting sample fits', () => {
    setup({
      target: FOOTER_TARGET,
      device: PREVIEW_DEVICE.TABLET,
      follow: followingFooter({
        outcome: LOOK_FOLLOW_OUTCOME.FITS,
        overflow: 0,
      }),
    });

    const line = followLine('fits', {
      part: FOOTER,
      device: PREVIEW_DEVICE.TABLET,
    });

    expect(followStatusText()).toBe(line);
  });

  it('shows the short line while the follow scroll is settling', () => {
    setup({
      target: FOOTER_TARGET,
      follow: mockLookFollow({ outline: FOOTER_OUTLINE, isFollowing: true }),
    });

    expect(followStatusText()).toBe(followLine('short', { part: FOOTER }));
  });

  describe('with the phone frame at the end of the page', () => {
    it('offers Top of page', async () => {
      const follow = followingFooter();
      setup({ target: FOOTER_TARGET, device: PREVIEW_DEVICE.PHONE, follow });

      await userEvent.click(topOfPageButton()!);

      expect(followStatusText()).toBe(followLine('atEnd', { part: FOOTER }));
      expect(follow.scrollToTop).toHaveBeenCalled();
    });

    it('keeps the short line and no Top of page with the reader note', () => {
      setup({
        target: FOOTER_TARGET,
        device: PREVIEW_DEVICE.PHONE,
        follow: followingFooter(),
        isShortLine: true,
        readerNote: READER_NOTE,
      });

      const line = `${followLine('short', { part: FOOTER })} ${READER_NOTE}`;

      expect(followStatusText()).toBe(line);
      expect(topOfPageButton()).not.toBeInTheDocument();
    });
  });

  it('leaves Top of page off a desktop frame at the end', () => {
    setup({ target: FOOTER_TARGET, follow: followingFooter() });

    expect(topOfPageButton()).not.toBeInTheDocument();
  });

  it.each([
    { target: FOOTER_TARGET, outline: FOOTER_OUTLINE, part: FOOTER },
    {
      target: CARDS_TARGET,
      outline: CARDS_OUTLINE,
      part: LOOK_FORM.cardsHeading,
    },
  ])(
    'offers a way back to $part once paused',
    async ({ target, outline, part }) => {
      const follow = mockLookFollow({ outline, isPaused: true });
      setup({ target, follow });

      const backButton = screen.getByRole('button', {
        name: followLine('backTo', { part }),
      });
      await userEvent.click(backButton);

      expect(followStatusText()).toBe(LOOK_FOLLOW.paused);
      expect(follow.resume).toHaveBeenCalled();
    },
  );

  it('drops the reader note while the way back shows', () => {
    setup({
      target: FOOTER_TARGET,
      follow: mockLookFollow({ outline: FOOTER_OUTLINE, isPaused: true }),
      readerNote: READER_NOTE,
    });

    expect(followStatusText()).toBe(LOOK_FOLLOW.paused);
  });

  it('says following is off with no way back but the toggle', () => {
    setup({
      target: FOOTER_TARGET,
      follow: mockLookFollow({ outline: FOOTER_OUTLINE, isOn: false }),
    });

    const button = screen.queryByRole('button');

    expect(followStatusText()).toBe(LOOK_FOLLOW.off);
    expect(button).not.toBeInTheDocument();
  });
});
