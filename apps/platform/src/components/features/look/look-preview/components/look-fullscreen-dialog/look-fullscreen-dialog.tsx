'use client';

import { Dialog } from '@base-ui/react/dialog';
import { ICONS, type TMaybeNull } from '@blog/config';
import { DeviceFrame } from '@platform/components/shared/device-frame';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';
import { previewFrameVariants } from '@platform/components/shared/preview-frame/preview-frame-variants';
import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import { KEY } from '@platform/constants/keyboard';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { toScalePercent } from '@platform/utils/device-frame-scale/device-frame-scale';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useTranslations } from 'next-intl';
import {
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { lookFullscreenDialogVariants } from './look-fullscreen-dialog-variants';
import { useStageArrowScroll } from './use-stage-arrow-scroll';

const FULLSCREEN_FIT = { mode: DEVICE_FRAME_FIT.FULLSCREEN };
const PRESSED_SELECTOR = '[aria-pressed="true"]';

export type TLookFullscreenDialogProps = {
  handle: Dialog.Handle<unknown>;
  device: TPreviewDevice;
  toolbar: ReactNode;
  host: string;
  isDark: boolean;
  finalFocus: RefObject<TMaybeNull<HTMLButtonElement>>;
  children: ReactNode;
};

export const LookFullscreenDialog = ({
  handle,
  device,
  toolbar,
  host,
  isDark,
  finalFocus,
  children,
}: TLookFullscreenDialogProps) => {
  const t = useTranslations('lookFullscreen');
  const tDevice = useTranslations('devicePreview');
  const tMode = useTranslations('previewModeControl');
  const isLgUp = useMediaQuery(MEDIA_QUERY.LG_UP);
  const [scale, setScale] = useState(1);
  const { frameRef, onKeyDown } = useStageArrowScroll();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const {
    popup,
    head,
    title,
    readoutPlacement,
    toolbar: toolbarSlot,
    rule,
    close,
    stage,
  } = lookFullscreenDialogVariants();
  const width = PREVIEW_DEVICE_WIDTH[device];
  const readoutValues = { width, percent: toScalePercent(scale) };
  const { readout } = previewFrameVariants();

  const focusPressedDevice = () =>
    toolbarRef.current?.querySelector<HTMLElement>(PRESSED_SELECTOR) ?? true;
  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === KEY.ESCAPE) {
      handle.close();
    }
  };

  return (
    <Dialog.Root handle={handle}>
      <Dialog.Portal>
        <Dialog.Popup
          aria-modal="true"
          initialFocus={focusPressedDevice}
          finalFocus={finalFocus}
          onKeyDownCapture={closeOnEscape}
          className={popup()}
        >
          <div className={head()}>
            <Dialog.Title className={title()}>
              {tMode('livePreviewHeading')}
            </Dialog.Title>
            <span
              role="status"
              className={readout({ class: readoutPlacement() })}
            >
              {tDevice(
                isLgUp ? 'readoutLong' : 'readoutPhoneTab',
                readoutValues,
              )}
            </span>
            <div ref={toolbarRef} className={toolbarSlot()}>
              {toolbar}
            </div>
            <span aria-hidden="true" className={rule()} />
            <span className={close()}>
              <IconSoloControl
                control={<Dialog.Close />}
                ariaLabel={t('close')}
                tooltip={t('close')}
                icon={ICONS.X}
                isTooltipEndAligned={true}
              />
            </span>
          </div>
          <div
            role="region"
            tabIndex={0}
            aria-label={tDevice('sampleAtWidth', { width })}
            className={stage()}
            onKeyDown={onKeyDown}
          >
            <DeviceFrame
              ref={frameRef}
              device={device}
              host={host}
              fit={FULLSCREEN_FIT}
              isDark={isDark}
              onScaleChange={setScale}
            >
              {children}
            </DeviceFrame>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
