'use client';

import { Heading } from '@platform/components/shared/heading';
import { previewFrameVariants } from '@platform/components/shared/preview-frame/preview-frame-variants';
import {
  PREVIEW_DEVICE_WIDTH,
  PREVIEW_HEADING_LAYOUT,
  PREVIEW_READOUT,
  type TPreviewDevice,
  type TPreviewHeadingLayout,
} from '@platform/constants/preview';
import { toScalePercent } from '@platform/utils/device-frame-scale/device-frame-scale';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export type TPreviewFrameHeadingProps = {
  device: TPreviewDevice;
  scale: number;
  layout?: TPreviewHeadingLayout;
};

export const PreviewFrameHeading = ({
  device,
  scale,
  layout = PREVIEW_HEADING_LAYOUT.SECTION,
}: TPreviewFrameHeadingProps) => {
  const t = useTranslations('devicePreview');
  const tMode = useTranslations('previewModeControl');
  const tTabs = useTranslations('viewTabs');
  const rowRef = useRef<HTMLDivElement>(null);
  const row = useElementSize(rowRef);
  const { headingRow, readout, title } = previewFrameVariants({
    isTitleHidden: layout === PREVIEW_HEADING_LAYOUT.PHONE_TAB,
  });
  const isPhoneTab = layout === PREVIEW_HEADING_LAYOUT.PHONE_TAB;
  const isLong =
    row === undefined || row.width >= PREVIEW_READOUT.LONG_MIN_WIDTH;
  const values = {
    width: PREVIEW_DEVICE_WIDTH[device],
    percent: toScalePercent(scale),
  };

  const readoutText = isPhoneTab
    ? t('readoutPhoneTab', values)
    : t(isLong ? 'readoutLong' : 'readoutShort', values);
  const titleText =
    isPhoneTab || isLong ? tMode('livePreviewHeading') : tTabs('previewTab');

  return (
    <div ref={rowRef} className={headingRow()}>
      <Heading level={2} size="previewTitle" className={title()}>
        {titleText}
      </Heading>
      <span role="status" className={readout()}>
        {readoutText}
      </span>
    </div>
  );
};
