import {
  DEVICE_FRAME_FIT,
  DEVICE_FRAME_LIMIT,
} from '@platform/constants/device-frame';
import { PREVIEW_DEVICE } from '@platform/constants/preview';

import {
  fitFullscreenScale,
  fitPageScale,
  resolveDeviceFrameLayout,
  scaleDeviceSize,
  toScalePercent,
  toScrollThumb,
} from './device-frame-scale';

const DESKTOP_STAGE_596 = 564;
const DESKTOP_STAGE_476 = 444;
const PHONE_TAB_HEIGHT = 523;
const NARROW_STAGE = 358;
const WIDE_STAGE = 5000;
const TABLET_FULLSCREEN_STAGE = 600;
const LARGE_AVAILABLE_HEIGHT = 5000;

describe(fitPageScale, () => {
  it('fits Desktop to the stage width', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: DESKTOP_STAGE_596,
    });

    expect(scale).toBe(0.4406);
    expect(scaleDeviceSize(PREVIEW_DEVICE.DESKTOP, scale)).toStrictEqual({
      width: 564,
      height: 352,
    });
  });

  it('rounds the Desktop viewport at a 476 px section', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: DESKTOP_STAGE_476,
    });

    expect(scaleDeviceSize(PREVIEW_DEVICE.DESKTOP, scale)).toStrictEqual({
      width: 444,
      height: 278,
    });
    expect(toScalePercent(scale)).toBe(35);
  });

  it('fits the Phone to the 608 px page height when the width allows', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: WIDE_STAGE,
    });

    expect(toScalePercent(scale)).toBe(72);
    expect(scaleDeviceSize(PREVIEW_DEVICE.PHONE, scale).height).toBe(608);
  });

  it('fits to a smaller height when the caller passes one', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: WIDE_STAGE,
      availableHeight: PHONE_TAB_HEIGHT,
    });

    expect(toScalePercent(scale)).toBe(62);
  });

  it('never grows taller than 608 px whatever height the caller passes', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: WIDE_STAGE,
      availableHeight: LARGE_AVAILABLE_HEIGHT,
    });

    expect(scaleDeviceSize(PREVIEW_DEVICE.PHONE, scale).height).toBe(
      DEVICE_FRAME_LIMIT.PAGE_HEIGHT,
    );
  });

  it('never scales above 1', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: WIDE_STAGE,
      availableHeight: LARGE_AVAILABLE_HEIGHT,
    });

    expect(scale).toBeLessThanOrEqual(1);
  });
});

describe(fitFullscreenScale, () => {
  it('fits by width alone and never above 100%', () => {
    const wide = fitFullscreenScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: WIDE_STAGE,
    });
    const narrow = fitFullscreenScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: TABLET_FULLSCREEN_STAGE,
    });

    expect(wide).toStrictEqual({ scale: 1, isPanning: false });
    expect(narrow.isPanning).toBe(false);
    expect(toScalePercent(narrow.scale)).toBe(73);
  });

  it('shows at 100% and pans when fitting would drop under 50%', () => {
    const fit = fitFullscreenScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: NARROW_STAGE,
    });

    expect(fit).toStrictEqual({ scale: 1, isPanning: true });
  });
});

describe(resolveDeviceFrameLayout, () => {
  it('has no layout before the stage is measured', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.DESKTOP,
      fit: { mode: DEVICE_FRAME_FIT.PAGE },
      stageWidth: undefined,
    });

    expect(layout).toBeUndefined();
  });

  it('sizes the page viewport to the scaled device', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.DESKTOP,
      fit: { mode: DEVICE_FRAME_FIT.PAGE },
      stageWidth: DESKTOP_STAGE_596,
    });

    expect(layout).toStrictEqual({
      scale: 0.4406,
      isPanning: false,
      viewport: { width: 564, height: 352 },
    });
  });

  it('leaves the full-screen viewport to fill the stage while panning', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.DESKTOP,
      fit: { mode: DEVICE_FRAME_FIT.FULLSCREEN },
      stageWidth: NARROW_STAGE,
    });

    expect(layout).toStrictEqual({
      scale: 1,
      isPanning: true,
      viewport: { width: undefined, height: undefined },
    });
  });

  it('sizes the full-screen viewport by width when it does not pan', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.TABLET,
      fit: { mode: DEVICE_FRAME_FIT.FULLSCREEN },
      stageWidth: WIDE_STAGE,
    });

    expect(layout).toStrictEqual({
      scale: 1,
      isPanning: false,
      viewport: { width: 820, height: undefined },
    });
  });
});

describe(toScrollThumb, () => {
  it('has no thumb when the content fits', () => {
    const thumb = toScrollThumb({
      offset: 0,
      viewportSize: 400,
      contentSize: 400,
    });

    expect(thumb).toBeNull();
  });

  it('sizes and places the thumb by the scroll position', () => {
    const thumb = toScrollThumb({
      offset: 200,
      viewportSize: 400,
      contentSize: 800,
    });

    expect(thumb).toStrictEqual({ start: 0.25, size: 0.5 });
  });

  it('keeps the thumb inside the track at the end of the scroll', () => {
    const thumb = toScrollThumb({
      offset: 900,
      viewportSize: 400,
      contentSize: 800,
    });

    expect(thumb).toStrictEqual({ start: 0.5, size: 0.5 });
  });
});
