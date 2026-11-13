import { DEVICE_FRAME_AXIS } from '@platform/constants/device-frame';
import { PREVIEW_DEVICE } from '@platform/constants/preview';
import { tv } from '@platform/utils/tv/tv';

export const deviceFrameVariants = tv({
  slots: {
    stage: ['flex w-full justify-center'],
    frame: [
      'flex w-fit flex-none flex-col overflow-hidden',
      'border-platform-control-line bg-platform-surface shadow-platform-frame',
    ],
    viewport: ['relative overflow-hidden bg-platform-surface'],
    scroller: [
      'absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    sizer: ['relative'],
    content: ['@container flex origin-top-left flex-col'],
    overlay: [
      'pointer-events-none absolute bottom-0 left-0 origin-bottom-left',
    ],
    browserBar: [
      'flex flex-none items-center gap-2.5 px-2.5',
      'border-b border-platform-line bg-platform-surface',
    ],
    dots: ['flex gap-[5px]'],
    dot: ['size-2 rounded-full bg-platform-frame-dot'],
    host: [
      'min-w-0 flex-1 truncate text-center',
      'font-platform-mono text-platform-11-5 font-medium text-platform-muted',
    ],
    hostSpacer: ['w-[39px] flex-none'],
    scrollbar: ['pointer-events-none absolute'],
    thumb: ['absolute rounded-platform-3'],
  },
  variants: {
    device: {
      [PREVIEW_DEVICE.DESKTOP]: { frame: ['rounded-platform'] },
      [PREVIEW_DEVICE.TABLET]: {
        frame: ['rounded-platform-14'],
        viewport: ['rounded-platform-8'],
      },
      [PREVIEW_DEVICE.PHONE]: {
        frame: ['rounded-platform-18'],
        viewport: ['rounded-platform-12'],
      },
    },
    isMeasured: {
      true: {},
      false: { frame: ['invisible'] },
    },
    isFullscreen: {
      true: {
        stage: ['h-full items-start'],
        frame: ['h-full'],
        viewport: ['min-h-0 flex-1'],
      },
      false: {},
    },
    isPanning: {
      true: {
        frame: ['w-full'],
        viewport: ['w-full'],
        scroller: ['overflow-x-auto'],
      },
      false: {},
    },
    isDark: {
      true: {
        scrollbar: ['bg-platform-frame-track-dark'],
        thumb: ['bg-platform-frame-thumb-dark'],
      },
      false: {
        scrollbar: ['bg-platform-frame-track'],
        thumb: ['bg-platform-frame-thumb'],
      },
    },
    axis: {
      [DEVICE_FRAME_AXIS.VERTICAL]: {
        scrollbar: ['top-1 right-[3px] bottom-1 w-[5px] rounded-platform-3'],
        thumb: ['inset-x-0'],
      },
      [DEVICE_FRAME_AXIS.HORIZONTAL]: {
        scrollbar: ['right-3 bottom-[3px] left-1 h-[5px] rounded-platform-3'],
        thumb: ['inset-y-0'],
      },
    },
  },
});
