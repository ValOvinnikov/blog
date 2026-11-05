import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import {
  LOOK_FOLLOW_OUTCOME,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import { LOOK_ROW } from '@platform/constants/look-row';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { act, renderHookWithIntl } from '@platform/testing/custom-render';
import { makeFakeFrame } from '@platform/testing/look/look-follow';
import { stubMatchingMediaQuery } from '@platform/testing/match-media';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';

import { useLookFollow } from './use-look-follow';

const IDLE: TLookFollowTarget = { kind: LOOK_FOLLOW_TARGET.IDLE };
const ALL_OPEN: TLookFollowTarget = { kind: LOOK_FOLLOW_TARGET.ALL_OPEN };
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
const RESIZED_SCALE = 0.4;
const SETTLE_MS = 100;
const SMOOTH: ScrollBehavior = 'smooth';
const INSTANT: ScrollBehavior = 'instant';
const END = DEVICE_FRAME_SCROLL_TARGET.END;
const TOP = DEVICE_FRAME_SCROLL_TARGET.TOP;

type TProps = {
  target: TLookFollowTarget;
  device: TPreviewDevice;
  scale: number;
  isShown: boolean;
};

type TSetupOptions = Partial<Parameters<typeof makeFakeFrame>[0]> &
  Partial<TProps>;

const setup = ({
  maxTop = MAX_TOP,
  contentHeight = TALL_SAMPLE_HEIGHT,
  top,
  ...initial
}: TSetupOptions = {}) => {
  const frame = makeFakeFrame({ top, maxTop, contentHeight });
  let props: TProps = {
    target: IDLE,
    device: PREVIEW_DEVICE.DESKTOP,
    scale: SCALE,
    isShown: true,
    ...initial,
  };
  const hook = renderHookWithIntl<ReturnType<typeof useLookFollow>, TProps>(
    (current) => useLookFollow(current),
    { initialProps: props },
  );
  hook.result.current.frameRef.current = frame.handle;
  const settle = () =>
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS);
    });
  const update = (next: Partial<TProps>) => {
    props = { ...props, ...next };
    hook.rerender(props);
    settle();
  };
  const current = () => hook.result.current.follow;

  return { ...frame, current, settle, update };
};

describe(useLookFollow, () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'Date'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scrolls a nearly fitting desktop sample to its footer and reports the overflow', () => {
    const { current, scrollTo, update } = setup({
      contentHeight: DESKTOP_SAMPLE_HEIGHT,
    });

    update({ target: FOOTER });

    expect(scrollTo).toHaveBeenCalledWith(END, SMOOTH);
    expect(current().settled).toEqual({
      outcome: LOOK_FOLLOW_OUTCOME.NEARLY_FITS,
      overflow: DESKTOP_OVERFLOW,
    });
  });

  it('reports the end of the page for a tall phone sample', () => {
    const { current, update } = setup({ device: PREVIEW_DEVICE.PHONE });

    update({ target: FOOTER });

    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
  });

  it('leaves a frame already at the header where it is', () => {
    const { current, scrollTo, update } = setup();

    update({ target: HEADER });

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.IN_VIEW);
  });

  it('scrolls back to the top when the header follows the footer', () => {
    const { current, update } = setup();

    update({ target: FOOTER });
    update({ target: HEADER });

    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_TOP);
  });

  it('only outlines when the sample fits the device screen', () => {
    const { current, scrollTo, update } = setup({
      maxTop: 0,
      contentHeight: PREVIEW_DEVICE_HEIGHT[PREVIEW_DEVICE.TABLET],
    });

    update({ target: FOOTER });

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.FITS);
  });

  it('returns the frame to the top once the open Site parts row folds', () => {
    const { position, update } = setup();
    update({ target: FOOTER });

    update({ target: IDLE });

    expect(position.top).toBe(0);
  });

  it.each([
    { name: 'a Style card', target: TYPE },
    { name: 'Expand all', target: ALL_OPEN },
  ])('leaves the frame where it is for $name', ({ target }) => {
    const { position, update } = setup();
    update({ target: FOOTER });

    update({ target });

    expect(position.top).toBe(MAX_TOP);
  });

  it('keeps the settled line through a change of scale', () => {
    const { current, update } = setup({ device: PREVIEW_DEVICE.PHONE });
    update({ target: FOOTER });

    update({ scale: RESIZED_SCALE });

    expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
  });

  describe('on the Preview tab', () => {
    it('jumps to the part once the tab opens', () => {
      const { current, scrollTo, update } = setup({ isShown: false });
      update({ target: FOOTER });

      update({ isShown: true });

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledWith(END, INSTANT);
      expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
    });

    it('opens at the top with no Site parts card open', () => {
      const { position, update } = setup({ isShown: false, top: MAX_TOP });

      update({ isShown: true });

      expect(position.top).toBe(0);
    });

    it('keeps the settled line when the tab opens again', () => {
      const { current, update } = setup({
        contentHeight: DESKTOP_SAMPLE_HEIGHT,
      });
      update({ target: FOOTER });

      update({ isShown: false });
      update({ isShown: true });

      expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.NEARLY_FITS);
    });
  });

  describe('under reduced motion', () => {
    beforeEach(() => {
      stubMatchingMediaQuery(MEDIA_QUERY.REDUCED_MOTION);
    });

    it('scrolls to the part at once', () => {
      const { scrollTo, update } = setup();

      update({ target: FOOTER });

      expect(scrollTo).toHaveBeenCalledWith(END, INSTANT);
    });

    it('jumps to the top of the page at once', () => {
      const { current, scrollTo, update } = setup({
        device: PREVIEW_DEVICE.PHONE,
      });
      update({ target: FOOTER });

      act(() => current().scrollToTop());

      expect(scrollTo).toHaveBeenLastCalledWith(TOP, INSTANT);
    });
  });

  describe('after a hand scroll', () => {
    it('pauses following', () => {
      const { current, update } = setup();
      update({ target: FOOTER });

      act(() => current().onHandScroll());

      expect(current().isPaused).toBe(true);
      expect(current().isFollowing).toBe(false);
    });

    it('resumes and scrolls again when another card opens', () => {
      const { current, scrollTo, update } = setup();
      update({ target: HEADER });
      act(() => current().onHandScroll());

      update({ target: FOOTER });

      expect(current().isPaused).toBe(false);
      expect(scrollTo).toHaveBeenLastCalledWith(END, SMOOTH);
    });

    it('scrolls back to the part on resume', () => {
      const { current, position, settle, update } = setup();
      update({ target: FOOTER });
      act(() => current().scrollToTop());

      act(() => current().resume());
      settle();

      expect(position.top).toBe(MAX_TOP);
      expect(current().settled?.outcome).toBe(LOOK_FOLLOW_OUTCOME.AT_END);
    });
  });

  it('never pauses on a hand scroll while nothing is followed', () => {
    const { current, update } = setup();
    update({ target: TYPE });

    act(() => current().onHandScroll());

    expect(current().isPaused).toBe(false);
  });

  it('keeps the frame still while following is off', () => {
    const { current, scrollTo, update } = setup({ top: MAX_TOP });
    act(() => current().onPressedChange(false));

    update({ target: FOOTER });
    update({ target: IDLE });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to the open part once following is turned back on', () => {
    const { current, scrollTo, settle, update } = setup();
    act(() => current().onPressedChange(false));
    update({ target: FOOTER });

    act(() => current().onPressedChange(true));
    settle();

    expect(scrollTo).toHaveBeenCalledWith(END, SMOOTH);
  });
});
