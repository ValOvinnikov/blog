'use client';

import { MorePresetsLabel } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/more-presets-label/more-presets-label';
import { morePresetsButtonVariants } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/more-presets-label/more-presets-label-variants';
import { MorePresetsPopover } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/more-presets-popover/more-presets-popover';
import { PresetChips } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-chips/preset-chips';
import { PresetSheet } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-sheet/preset-sheet';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useRef } from 'react';

import type { TPresetOption } from './preset-option';
import { presetStripVariants } from './preset-strip-variants';
import { usePresetChipFit } from './use-preset-chip-fit';

export type TPresetStripProps<TId extends string> = {
  presets: TPresetOption<TId>[];
  value: TId;
  onChange: (value: TId) => void;
  labelledBy: string;
  describedBy?: string;
  isDisabled?: boolean;
};

export const PresetStrip = <TId extends string>({
  presets,
  value,
  onChange,
  labelledBy,
  describedBy,
  isDisabled,
}: TPresetStripProps<TId>) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const isLgUp = useMediaQuery(MEDIA_QUERY.LG_UP);
  const visible = usePresetChipFit({
    rowRef,
    measureRef,
    presets,
    value,
  }).flatMap((index) => presets[index] ?? []);
  const selected = presets.find(({ id }) => id === value);
  const isOverflowing = visible.length < presets.length;
  const access = { labelledBy, describedBy, isDisabled };
  const { root, row, measure } = presetStripVariants();

  return (
    <div className={root()}>
      <div ref={rowRef} className={row()}>
        {isOverflowing && !isLgUp && selected ? (
          <PresetSheet
            presets={presets}
            selected={selected}
            onChange={onChange}
            {...access}
          />
        ) : (
          <PresetChips
            presets={visible}
            value={value}
            onChange={onChange}
            {...access}
          />
        )}
        {isOverflowing && isLgUp && (
          <MorePresetsPopover
            presets={presets}
            value={value}
            onChange={onChange}
            hiddenCount={presets.length - visible.length}
            anchorRef={rowRef}
            describedBy={describedBy}
            isDisabled={isDisabled}
          />
        )}
      </div>
      <div
        ref={measureRef}
        className={measure()}
        aria-hidden="true"
        inert={true}
      >
        <PresetChips
          presets={presets}
          value={value}
          onChange={onChange}
          labelledBy={labelledBy}
        />
        <span className={morePresetsButtonVariants()}>
          <MorePresetsLabel hiddenCount={presets.length} />
        </span>
      </div>
    </div>
  );
};
