'use client';

import { Drawer } from '@base-ui/react/drawer';
import { ICONS } from '@blog/config';
import { PresetOptionList } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-option-list/preset-option-list';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { DIALOG_BACKDROP_TONE } from '@platform/constants/dialog-backdrop';
import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import { dialogBackdropVariants } from '@platform/utils/dialog-backdrop-variants/dialog-backdrop-variants';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { PresetSheetSummary } from './components/preset-sheet-summary/preset-sheet-summary';
import { presetSheetVariants } from './preset-sheet-variants';

type TPresetSheetProps<TId extends string> = {
  presets: TPresetOption<TId>[];
  selected: TPresetOption<TId>;
  onChange: (value: TId) => void;
  labelledBy: string;
  describedBy?: string;
  isDisabled?: boolean;
};

export const PresetSheet = <TId extends string>({
  presets,
  selected,
  onChange,
  labelledBy,
  describedBy,
  isDisabled,
}: TPresetSheetProps<TId>) => {
  const t = useTranslations('presetPicker');
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const titleId = useId();
  const { trigger, viewport, popup, handle, header, title, close } =
    presetSheetVariants();

  const choose = (id: TId) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger
        disabled={isDisabled}
        aria-labelledby={`${labelledBy} ${nameId}`}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        className={trigger()}
      >
        <PresetSheetSummary
          preset={selected}
          total={presets.length}
          nameId={nameId}
        />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop
          className={dialogBackdropVariants({
            tone: DIALOG_BACKDROP_TONE.SCRIM,
          })}
        />
        <Drawer.Viewport className={viewport()}>
          <Drawer.Popup
            initialFocus={listRef}
            aria-modal="true"
            className={popup()}
          >
            <div className={handle()} aria-hidden="true" />
            <div className={header()}>
              <Drawer.Title id={titleId} className={title()}>
                {t('choosePreset')}
              </Drawer.Title>
              <IconSoloButton
                ariaLabel={t('close')}
                tooltip={t('close')}
                icon={ICONS.X}
                onClick={() => setIsOpen(false)}
                isTooltipEndAligned={true}
                className={close()}
              />
            </div>
            <PresetOptionList
              ref={listRef}
              presets={presets}
              value={selected.id}
              onChoose={choose}
              labelledBy={titleId}
              layout={PRESET_LIST_LAYOUT.ROWS}
            />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
