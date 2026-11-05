'use client';

import { DeviceFrameBrowserBar } from '@platform/components/shared/device-frame/components/browser-bar/device-frame-browser-bar';
import { DeviceFrameOverlay } from '@platform/components/shared/device-frame/components/overlay/device-frame-overlay';
import { DeviceFrameScrollbar } from '@platform/components/shared/device-frame/components/scrollbar/device-frame-scrollbar';
import {
  DEVICE_FRAME_AXIS,
  DEVICE_FRAME_FIT,
  DEVICE_FRAME_SIZE,
  DEVICE_FRAME_TEST_ID,
  DEVICE_FRAME_VIEWPORT_ATTRIBUTE,
} from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { mapCompoundSlots, type TCompoundComponent } from '@platform/lib/react';
import type { TDeviceFrameFit } from '@platform/utils/device-frame-scale/device-frame-scale';
import { useTranslations } from 'next-intl';
import { Fragment, type ElementType, type ReactNode, type Ref } from 'react';

import { deviceFrameVariants } from './device-frame-variants';
import { useDeviceFrame } from './use-device-frame';
import type { TDeviceFrameHandle } from './use-device-frame-handle';

const DeviceFrameParts = {
  Overlay: DeviceFrameOverlay,
} satisfies Record<string, ElementType>;

const PAGE_FIT: TDeviceFrameFit = { mode: DEVICE_FRAME_FIT.PAGE };

type TDeviceFrameProps = {
  device: TPreviewDevice;
  host?: string;
  fit?: TDeviceFrameFit;
  isDark: boolean;
  onScaleChange?(scale: number): void;
  onHandScroll?(): void;
  children: ReactNode;
  ref?: Ref<TDeviceFrameHandle>;
};

const DeviceFrameRoot = ({
  device,
  host,
  fit = PAGE_FIT,
  isDark,
  onScaleChange,
  onHandScroll,
  children,
  ref,
}: TDeviceFrameProps) => {
  const t = useTranslations('devicePreview');
  const {
    stageRef,
    viewportRef,
    scrollerRef,
    contentRef,
    scale,
    isMeasured,
    isPanning,
    isFullscreen,
    viewport,
    viewportSize,
    sizer,
    verticalThumb,
    horizontalThumb,
    scrollerProps,
  } = useDeviceFrame({ device, fit, onScaleChange, onHandScroll, ref });
  const {
    stage,
    frame,
    viewport: viewportSlot,
    scroller,
    sizer: sizerSlot,
    content,
    overlay,
  } = deviceFrameVariants({ device, isMeasured, isPanning, isFullscreen });
  const { slots, unmatched } = mapCompoundSlots(children, DeviceFrameParts);
  const width = PREVIEW_DEVICE_WIDTH[device];
  const height = PREVIEW_DEVICE_HEIGHT[device];
  const transform = `scale(${scale})`;
  const isDesktop = device === PREVIEW_DEVICE.DESKTOP;

  return (
    <div ref={stageRef} className={stage()}>
      <div
        role={isFullscreen ? undefined : 'img'}
        aria-label={isFullscreen ? undefined : t('sampleAtWidth', { width })}
        className={frame()}
        style={{
          borderWidth: DEVICE_FRAME_SIZE.BORDER,
          padding: isDesktop ? undefined : DEVICE_FRAME_SIZE.BEZEL_PADDING,
        }}
        data-testid={DEVICE_FRAME_TEST_ID.FRAME}
      >
        {isDesktop && <DeviceFrameBrowserBar host={host} />}
        <div
          ref={viewportRef}
          className={viewportSlot()}
          style={{ width: viewport.width, height: viewport.height }}
          data-testid={DEVICE_FRAME_TEST_ID.VIEWPORT}
          {...{ [DEVICE_FRAME_VIEWPORT_ATTRIBUTE]: '' }}
        >
          <div ref={scrollerRef} className={scroller()} {...scrollerProps}>
            <div className={sizerSlot()} style={sizer}>
              <div
                ref={contentRef}
                inert={true}
                className={content()}
                style={{ width, minHeight: height, transform }}
                data-testid={DEVICE_FRAME_TEST_ID.CONTENT}
              >
                {unmatched.map((node, index) => (
                  <Fragment key={index}>{node}</Fragment>
                ))}
              </div>
            </div>
          </div>
          {slots.Overlay && (
            <div
              inert={true}
              className={overlay()}
              style={{
                width,
                height: viewportSize.height / scale,
                transform,
              }}
            >
              {slots.Overlay}
            </div>
          )}
          {verticalThumb && (
            <DeviceFrameScrollbar
              axis={DEVICE_FRAME_AXIS.VERTICAL}
              thumb={verticalThumb}
              isDark={isDark}
            />
          )}
          {horizontalThumb && (
            <DeviceFrameScrollbar
              axis={DEVICE_FRAME_AXIS.HORIZONTAL}
              thumb={horizontalThumb}
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const DeviceFrame: TCompoundComponent<
  typeof DeviceFrameRoot,
  typeof DeviceFrameParts
> = Object.assign(DeviceFrameRoot, DeviceFrameParts);
