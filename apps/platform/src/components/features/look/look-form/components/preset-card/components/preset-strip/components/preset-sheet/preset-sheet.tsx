'use client';

import { Drawer } from '@base-ui/react/drawer';
import { ICONS } from '@blog/config';
import { PresetOptionList } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-option-list/preset-option-list';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { dialogBackdropVariants } from '@platform/components/shared/dialog-backdrop';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { DIALOG_BACKDROP_TONE } from '@platform/constants/dialog-backdrop';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { PresetSheetSummary } from './components/preset-sheet-summary/preset-sheet-summary';

const presetSheetVariants = tv({
  slots: {
    trigger: [
      'flex min-h-14 w-full cursor-pointer items-center gap-2.5 rounded-admin-control border border-admin-control-line bg-admin-surface px-2.5 py-2 text-left',
      'data-[popup-open]:border-admin-brand-ink data-[popup-open]:shadow-admin-choice-ring',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    viewport: ['fixed inset-0 z-40 flex items-end'],
    popup: [
      'flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-admin-12 bg-admin-surface text-admin-text shadow-admin-sheet outline-none',
      'translate-y-(--drawer-swipe-movement-y) transition-transform duration-base ease-smooth data-[swiping]:duration-0',
      'data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
    ],
    handle: [
      'mx-auto mt-2 h-1 w-9 shrink-0 rounded-admin-bar bg-admin-control-line',
    ],
    header: ['flex items-center justify-between py-1.5 pr-2 pl-4'],
    title: ['text-admin-16 font-semibold'],
    close: ['border-0 bg-transparent'],
  },
});

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
