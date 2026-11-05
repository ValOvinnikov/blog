'use client';

import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import {
  LOOK_FOLLOW_MARK,
  LOOK_FOLLOW_TEST_ID,
} from '@platform/constants/look-follow';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import {
  LOOK_FOLLOW_PART,
  type TSitePartsRow,
} from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { lookFollowMarkVariants } from './look-follow-mark-variants';
import { usePartBox } from './use-part-box';

export type TLookFollowMarkProps = {
  row: TSitePartsRow;
  scale: number;
};

export const LookFollowMark = ({ row, scale }: TLookFollowMarkProps) => {
  const t = useTranslations('lookForm');
  const part = LOOK_FOLLOW_PART[row];
  const markRef = useRef<HTMLDivElement>(null);
  const box = usePartBox(markRef, part, scale);
  const isTagBelow = part === SAMPLE_PART.HEADER;
  const { mark, tag } = lookFollowMarkVariants({ isTagBelow });
  const outlineWidth = LOOK_FOLLOW_MARK.OUTLINE_WIDTH / scale;
  const radius = `${LOOK_FOLLOW_MARK.TAG_RADIUS / scale}px`;

  return (
    <div
      ref={markRef}
      aria-hidden="true"
      hidden={!box}
      className={mark()}
      style={{ ...box, outlineWidth, outlineOffset: -outlineWidth }}
      data-testid={LOOK_FOLLOW_TEST_ID.OUTLINE}
    >
      <span
        className={tag()}
        style={{
          fontSize: LOOK_FOLLOW_MARK.TAG_FONT_SIZE / scale,
          height: LOOK_FOLLOW_MARK.TAG_HEIGHT / scale,
          paddingInline: LOOK_FOLLOW_MARK.TAG_PADDING_X / scale,
          borderRadius: isTagBelow
            ? `0 0 ${radius} ${radius}`
            : `${radius} ${radius} 0 0`,
        }}
      >
        {t(LOOK_ROW_TITLE_KEY[row])}
      </span>
    </div>
  );
};
