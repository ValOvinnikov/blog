'use client';

import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import {
  LOOK_FOLLOW_MARK,
  LOOK_FOLLOW_TEST_ID,
} from '@platform/constants/look-follow';
import type { TLookFollowOutline } from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { lookFollowMarkVariants } from './look-follow-mark-variants';
import { usePartBoxes } from './use-part-boxes';

export type TLookFollowMarkProps = {
  outline: TLookFollowOutline;
  scale: number;
};

export const LookFollowMark = ({
  outline: { row, parts },
  scale,
}: TLookFollowMarkProps) => {
  const t = useTranslations('lookForm');
  const rootRef = useRef<HTMLDivElement>(null);
  const boxes = usePartBoxes(rootRef, parts, scale);
  const [first] = boxes;
  const outlineWidth = LOOK_FOLLOW_MARK.OUTLINE_WIDTH / scale;
  const outlineOffset = LOOK_FOLLOW_MARK.OUTLINE_OFFSET / scale;
  const tagHeight = LOOK_FOLLOW_MARK.TAG_HEIGHT / scale;
  const ringOutset = first?.isInset ? 0 : outlineOffset + outlineWidth;
  const isTagBelow = !!first && first.top < tagHeight + ringOutset;
  const { root, mark, tag } = lookFollowMarkVariants({ isTagBelow });
  const radius = `${LOOK_FOLLOW_MARK.TAG_RADIUS / scale}px`;

  return (
    <div ref={rootRef} className={root()}>
      {boxes.map(({ key, isInset, ...box }, index) => (
        <div
          key={key}
          aria-hidden="true"
          className={mark()}
          style={{
            ...box,
            outlineWidth,
            outlineOffset: isInset ? -outlineWidth : outlineOffset,
          }}
          data-testid={LOOK_FOLLOW_TEST_ID.OUTLINE}
        >
          {index === 0 && (
            <span
              className={tag()}
              style={{
                fontSize: LOOK_FOLLOW_MARK.TAG_FONT_SIZE / scale,
                height: tagHeight,
                left: -ringOutset,
                [isTagBelow ? 'marginTop' : 'marginBottom']: ringOutset,
                paddingInline: LOOK_FOLLOW_MARK.TAG_PADDING_X / scale,
                borderRadius: isTagBelow
                  ? `0 0 ${radius} ${radius}`
                  : `${radius} ${radius} 0 0`,
              }}
              data-testid={LOOK_FOLLOW_TEST_ID.TAG}
            >
              {t(LOOK_ROW_TITLE_KEY[row])}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
