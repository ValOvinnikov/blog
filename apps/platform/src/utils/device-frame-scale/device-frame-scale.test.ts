import {
  DEVICE_FRAME_FIT,
  DEVICE_FRAME_LIMIT,
} from '@platform/constants/device-frame';
import { PREVIEW_DEVICE } from '@platform/constants/preview';

import {
  fitFullscreenScale,
  fitPageScale,
  fitStageScale,
  resolveDeviceFrameLayout,
  scaleDeviceSize,
  toScalePercent,
  toScrollThumb,
} from './device-frame-scale';

const MOCK_DESKTOP_STAGE = 564;
const MOCK_PHONE_TAB_HEIGHT = 523;
const MOCK_NARROW_STAGE = 358;
const MOCK_HALF_STAGE = 640;
const MOCK_WIDE_STAGE = 5000;
const MOCK_TABLET_FULLSCREEN_STAGE = 600;
const MOCK_LARGE_AVAILABLE_HEIGHT = 5000;
const MOCK_FULL_STAGE = 472;
const MOCK_SHORT_FULL_STAGE_HEIGHT = 500;
const MOCK_FULL_STAGE_HEIGHT = 728;

describe(fitPageScale, () => {
  it.each([
    {
      title: 'Desktop in a 596 px section',
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: 564,
      scale: 0.4406,
      size: { width: 564, height: 352 },
      percent: 44,
    },
    {
      title: 'Desktop in a 476 px section',
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: 444,
      scale: 0.3469,
      size: { width: 444, height: 278 },
      percent: 35,
    },
    {
      title: 'Desktop in a 426 px section',
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: 394,
      scale: 0.3078,
      size: { width: 394, height: 246 },
      percent: 31,
    },
    {
      title: 'Desktop in a 704 px section',
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: 670,
      scale: 0.5234,
      size: { width: 670, height: 419 },
      percent: 52,
    },
    {
      title: 'Phone in a 600 px section',
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: 568,
      scale: 0.7204,
      size: { width: 281, height: 608 },
      percent: 72,
    },
    {
      title: 'Phone in a 426 px section',
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: 394,
      scale: 0.7204,
      size: { width: 281, height: 608 },
      percent: 72,
    },
    {
      title: 'Phone with 523 px of height',
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: MOCK_WIDE_STAGE,
      availableHeight: MOCK_PHONE_TAB_HEIGHT,
      scale: 0.6197,
      size: { width: 242, height: 523 },
      percent: 62,
    },
  ])(
    'fits the $title',
    ({ device, availableWidth, availableHeight, scale, size, percent }) => {
      const fitted = fitPageScale({ device, availableWidth, availableHeight });

      expect(fitted).toBe(scale);
      expect(scaleDeviceSize(device, fitted)).toStrictEqual(size);
      expect(toScalePercent(fitted)).toBe(percent);
    },
  );

  it.each([
    { title: '426', availableWidth: 394, scale: 0.4805, percent: 48 },
    { title: '596', availableWidth: 564, scale: 0.5153, percent: 52 },
  ])(
    'fits the Tablet in a $title px section',
    ({ availableWidth, scale, percent }) => {
      const fitted = fitPageScale({
        device: PREVIEW_DEVICE.TABLET,
        availableWidth,
      });

      expect(fitted).toBe(scale);
      expect(toScalePercent(fitted)).toBe(percent);
    },
  );

  it('never grows taller than 608 px whatever height the caller passes', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: MOCK_WIDE_STAGE,
      availableHeight: MOCK_LARGE_AVAILABLE_HEIGHT,
    });

    expect(scaleDeviceSize(PREVIEW_DEVICE.PHONE, scale).height).toBe(
      DEVICE_FRAME_LIMIT.PAGE_HEIGHT,
    );
  });

  it('never scales above 1', () => {
    const scale = fitPageScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: MOCK_WIDE_STAGE,
      availableHeight: MOCK_LARGE_AVAILABLE_HEIGHT,
    });

    expect(scale).toBeLessThanOrEqual(1);
  });
});

describe(fitStageScale, () => {
  it('fits by width alone when no height is given', () => {
    const scale = fitStageScale({
      device: PREVIEW_DEVICE.PHONE,
      availableWidth: MOCK_NARROW_STAGE,
    });

    expect(toScalePercent(scale)).toBe(88);
  });

  it('grows taller than 608 px when the stage is taller', () => {
    const scale = fitStageScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: MOCK_FULL_STAGE,
      availableHeight: MOCK_LARGE_AVAILABLE_HEIGHT,
    });

    expect(scaleDeviceSize(PREVIEW_DEVICE.TABLET, scale)).toStrictEqual({
      width: 458,
      height: 659,
    });
  });

  it('fits a short stage by its height', () => {
    const scale = fitStageScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: MOCK_FULL_STAGE,
      availableHeight: MOCK_SHORT_FULL_STAGE_HEIGHT,
    });

    expect(toScalePercent(scale)).toBe(41);
  });

  it.each([
    {
      device: PREVIEW_DEVICE.DESKTOP,
      availableHeight: MOCK_SHORT_FULL_STAGE_HEIGHT,
      viewport: { width: 752, height: 470 },
    },
    {
      device: PREVIEW_DEVICE.PHONE,
      availableHeight: MOCK_FULL_STAGE_HEIGHT,
      viewport: { width: 330, height: 714 },
    },
  ])(
    'keeps the $device frame, its chrome included, inside a stage its height bounds',
    ({ device, availableHeight, viewport }) => {
      const scale = fitStageScale({
        device,
        availableWidth: MOCK_WIDE_STAGE,
        availableHeight,
      });

      expect(scaleDeviceSize(device, scale)).toStrictEqual(viewport);
    },
  );

  it('never shows the stage larger than the device', () => {
    const scale = fitStageScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: MOCK_WIDE_STAGE,
    });

    expect(scale).toBe(1);
  });
});

describe(fitFullscreenScale, () => {
  it('fits by width alone and never above 100%', () => {
    const wide = fitFullscreenScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: MOCK_WIDE_STAGE,
    });
    const narrow = fitFullscreenScale({
      device: PREVIEW_DEVICE.TABLET,
      availableWidth: MOCK_TABLET_FULLSCREEN_STAGE,
    });

    expect(wide).toStrictEqual({ scale: 1, isPanning: false });
    expect(narrow.isPanning).toBe(false);
    expect(toScalePercent(narrow.scale)).toBe(73);
  });

  it('fits without panning at exactly 50%', () => {
    const fit = fitFullscreenScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: MOCK_HALF_STAGE,
    });

    expect(fit).toStrictEqual({ scale: 0.5, isPanning: false });
  });

  it('shows at 100% and pans when fitting would drop under 50%', () => {
    const fit = fitFullscreenScale({
      device: PREVIEW_DEVICE.DESKTOP,
      availableWidth: MOCK_NARROW_STAGE,
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
      stageWidth: MOCK_DESKTOP_STAGE,
    });

    expect(layout).toStrictEqual({
      scale: 0.4406,
      isPanning: false,
      viewport: { width: 564, height: 352 },
    });
  });

  it('sizes the stage viewport to the scaled device', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.TABLET,
      fit: {
        mode: DEVICE_FRAME_FIT.STAGE,
        availableHeight: MOCK_LARGE_AVAILABLE_HEIGHT,
      },
      stageWidth: MOCK_FULL_STAGE,
    });

    expect(layout).toStrictEqual({
      scale: 0.5585,
      isPanning: false,
      viewport: { width: 458, height: 659 },
    });
  });

  it('leaves the full-screen viewport to fill the stage while panning', () => {
    const layout = resolveDeviceFrameLayout({
      device: PREVIEW_DEVICE.DESKTOP,
      fit: { mode: DEVICE_FRAME_FIT.FULLSCREEN },
      stageWidth: MOCK_NARROW_STAGE,
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
      stageWidth: MOCK_WIDE_STAGE,
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
