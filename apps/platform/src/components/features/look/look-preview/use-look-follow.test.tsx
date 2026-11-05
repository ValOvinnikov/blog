import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import {
  LOOK_FOLLOW_OUTCOME,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { act, renderHookWithIntl } from '@platform/testing/custom-render';
import { makeFakeFrame } from '@platform/testing/look/look-follow';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';

import { useLookFollow } from './use-look-follow';

const IDLE: TLookFollowTarget = { kind: LOOK_FOLLOW_TARGET.IDLE };
const HEADER: TLookFollowTarget = {
  kind: LOOK_FOLLOW_TARGET.PART,
  row: LOOK_ROW.HEADER,
};
const FOOTER: TLookFollowTarget = {
  kind: LOOK_FOLLOW_TARGET.PART,
  row: LOOK_ROW.FOOTER,
};
const TYPE: TLookFollowTarget = {
  kind: LOOK_FOLLOW_TARGET.STYLE,
  row: LOOK_ROW.TYPE,
};
const DESKTOP_SAMPLE_HEIGHT = 920;
const DESKTOP_OVERFLOW = 120;
const TALL_SAMPLE_HEIGHT = 2400;
const MAX_TOP = 300;
const SCALE = 0.5;
const SETTLE_MS = 100;

type TProps = { target: TLookFollowTarget; device: TPreviewDevice };

const setup = (
  frameOptions: Parameters<typeof makeFakeFrame>[0],
  device: TPreviewDevice = PREVIEW_DEVICE.DESKTOP,
) => {
  const frame = makeFakeFrame(frameOptions);
  const hook = renderHookWithIntl<ReturnType<typeof useLookFollow>, TProps>(
    ({ target, device: shownDevice }: TProps) =>
      useLookFollow({
        target,
        device: shownDevice,
        scale: SCALE,
        isShown: true,
      }),
    { initialProps: { target: IDLE, device } },
  );
  hook.result.current.frameRef.current = frame.handle;
  const current = () => hook.result.current.follow;
  const follow = (target: TLookFollowTarget) => {
    hook.rerender({ target, device });
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS);
    });
  };

  return { ...frame, current, follow };
};

describe(useLookFollow, () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'Date'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scrolls a nearly fitting desktop sample to its footer and reports the overflow', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: DESKTOP_SAMPLE_HEIGHT,
    });

    follow(FOOTER);

    expect(scrollTo).toHaveBeenCalledWith(
      DEVICE_FRAME_SCROLL_TARGET.END,
      'smooth',
    );
    expect(current().settled).toMatchObject({
      outcome: LOOK_FOLLOW_OUTCOME.NEARLY_FITS,
      overflow: DESKTOP_OVERFLOW,
    });
  });

  it('reports the end of the page for a tall phone sample', () => {
    const { current, follow } = setup(
      { maxTop: MAX_TOP, contentHeight: TALL_SAMPLE_HEIGHT },
      PREVIEW_DEVICE.PHONE,
    );

    follow(FOOTER);

    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
  });

  it('leaves a frame already at the header where it is', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: TALL_SAMPLE_HEIGHT,
    });

    follow(HEADER);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.IN_VIEW);
  });

  it('scrolls back to the top when the header follows the footer', () => {
    const { current, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: TALL_SAMPLE_HEIGHT,
    });

    follow(FOOTER);
    follow(HEADER);

    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_TOP);
  });

  it('only outlines when the sample fits the device screen', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: 0,
      contentHeight: PREVIEW_DEVICE_HEIGHT[PREVIEW_DEVICE.TABLET],
    });

    follow(FOOTER);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.FITS);
  });

  it('never scrolls for a Style card', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: TALL_SAMPLE_HEIGHT,
    });

    follow(TYPE);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current().isFollowing).toBe(false);
  });

  describe('after a hand scroll', () => {
    it('pauses following', () => {
      const { current, follow } = setup({
        maxTop: MAX_TOP,
        contentHeight: TALL_SAMPLE_HEIGHT,
      });
      follow(FOOTER);

      act(() => current().onHandScroll());

      expect(current().isPaused).toBe(true);
      expect(current().isFollowing).toBe(false);
    });

    it('resumes and scrolls again when another card opens', () => {
      const { current, scrollTo, follow } = setup({
        maxTop: MAX_TOP,
        contentHeight: TALL_SAMPLE_HEIGHT,
      });
      follow(HEADER);
      act(() => current().onHandScroll());

      follow(FOOTER);

      expect(current().isPaused).toBe(false);
      expect(scrollTo).toHaveBeenLastCalledWith(
        DEVICE_FRAME_SCROLL_TARGET.END,
        'smooth',
      );
    });

    it('scrolls back to the part on resume', () => {
      const { current, position, follow } = setup({
        maxTop: MAX_TOP,
        contentHeight: TALL_SAMPLE_HEIGHT,
      });
      follow(FOOTER);
      act(() => current().scrollToTop());

      act(() => current().resume());
      act(() => {
        vi.advanceTimersByTime(SETTLE_MS);
      });

      expect(position.top).toBe(MAX_TOP);
      expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
    });
  });

  it('keeps the frame still while following is off', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: TALL_SAMPLE_HEIGHT,
    });
    act(() => current().onPressedChange(false));

    follow(FOOTER);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to the open part once following is turned back on', () => {
    const { current, scrollTo, follow } = setup({
      maxTop: MAX_TOP,
      contentHeight: TALL_SAMPLE_HEIGHT,
    });
    act(() => current().onPressedChange(false));
    follow(FOOTER);

    act(() => current().onPressedChange(true));
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS);
    });

    expect(scrollTo).toHaveBeenCalledWith(
      DEVICE_FRAME_SCROLL_TARGET.END,
      'smooth',
    );
  });
});
