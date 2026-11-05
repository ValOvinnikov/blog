'use client';

import { isUndefined } from '@blog/utils/primitives';
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
import { useRef, type ReactNode } from 'react';

export type TPreviewFrameHeadingProps = {
  device: TPreviewDevice;
  scale: number;
  layout?: TPreviewHeadingLayout;
  isAlwaysLong?: boolean;
  actions?: ReactNode;
};

export const PreviewFrameHeading = ({
  device,
  scale,
  layout = PREVIEW_HEADING_LAYOUT.SECTION,
  isAlwaysLong = false,
  actions,
}: TPreviewFrameHeadingProps) => {
  const t = useTranslations('devicePreview');
  const tMode = useTranslations('previewModeControl');
  const tTabs = useTranslations('viewTabs');
  const rowRef = useRef<HTMLDivElement>(null);
  const row = useElementSize(rowRef);
  const { headingRow, readout, title, headingActions } = previewFrameVariants({
    isTitleHidden: layout === PREVIEW_HEADING_LAYOUT.PHONE_TAB,
    hasHeadingActions: Boolean(actions),
  });
  const isPhoneTab = layout === PREVIEW_HEADING_LAYOUT.PHONE_TAB;
  const isLong =
    isAlwaysLong ||
    isUndefined(row) ||
    row.width >= PREVIEW_READOUT.LONG_MIN_WIDTH;
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
      {actions && <span className={headingActions()}>{actions}</span>}
    </div>
  );
};
