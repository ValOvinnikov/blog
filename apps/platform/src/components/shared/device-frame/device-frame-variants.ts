import { DEVICE_FRAME_AXIS } from '@platform/constants/device-frame';
import { PREVIEW_DEVICE } from '@platform/constants/preview';
import { tv } from '@platform/utils/tv/tv';

export const deviceFrameVariants = tv({
  slots: {
    stage: ['flex w-full justify-center'],
    frame: [
      'flex w-fit flex-none flex-col overflow-hidden',
      'border-admin-control-line bg-admin-surface shadow-admin-frame',
    ],
    viewport: ['relative overflow-hidden bg-admin-surface'],
    scroller: [
      'absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    sizer: ['relative'],
    content: ['@container origin-top-left'],
    overlay: [
      'pointer-events-none absolute bottom-0 left-0 origin-bottom-left',
    ],
    browserBar: [
      'flex flex-none items-center gap-2.5 px-2.5',
      'border-b border-admin-line bg-admin-surface',
    ],
    dots: ['flex gap-[5px]'],
    dot: ['size-2 rounded-full bg-admin-frame-dot'],
    host: [
      'min-w-0 flex-1 truncate text-center',
      'font-admin-mono text-admin-11-5 font-medium text-admin-muted',
    ],
    hostSpacer: ['w-[39px] flex-none'],
    scrollbar: ['pointer-events-none absolute'],
    thumb: ['absolute rounded-admin-3'],
  },
  variants: {
    device: {
      [PREVIEW_DEVICE.DESKTOP]: { frame: ['rounded-admin'] },
      [PREVIEW_DEVICE.TABLET]: {
        frame: ['rounded-admin-14'],
        viewport: ['rounded-admin-8'],
      },
      [PREVIEW_DEVICE.PHONE]: {
        frame: ['rounded-admin-18'],
        viewport: ['rounded-admin-12'],
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
        scrollbar: ['bg-admin-frame-track-dark'],
        thumb: ['bg-admin-frame-thumb-dark'],
      },
      false: {
        scrollbar: ['bg-admin-frame-track'],
        thumb: ['bg-admin-frame-thumb'],
      },
    },
    axis: {
      [DEVICE_FRAME_AXIS.VERTICAL]: {
        scrollbar: ['top-1 right-[3px] bottom-1 w-[5px] rounded-admin-3'],
        thumb: ['inset-x-0'],
      },
      [DEVICE_FRAME_AXIS.HORIZONTAL]: {
        scrollbar: ['right-3 bottom-[3px] left-1 h-[5px] rounded-admin-3'],
        thumb: ['inset-y-0'],
      },
    },
  },
});
