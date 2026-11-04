'use client';

import { Popover } from '@base-ui/react/popover';
import type { TMaybeNull } from '@blog/config';
import { MorePresetsLabel } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/more-presets-label/more-presets-label';
import { morePresetsButtonVariants } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/more-presets-label/more-presets-label-variants';
import { PresetOptionList } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-option-list/preset-option-list';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { KEY } from '@platform/constants/keyboard';
import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

const CHECKED_CHIP_SELECTOR = '[role="radio"][aria-checked="true"]';

const morePresetsPopoverVariants = tv({
  slots: {
    positioner: ['w-(--anchor-width)'],
    header: ['flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2.5'],
    title: ['text-admin-14 font-semibold'],
    count: ['text-admin-12-5 text-admin-muted'],
  },
});

type TMorePresetsPopoverProps<TId extends string> = {
  presets: TPresetOption<TId>[];
  value: TId;
  onChange: (value: TId) => void;
  hiddenCount: number;
  anchorRef: RefObject<TMaybeNull<HTMLElement>>;
  describedBy?: string;
  isDisabled?: boolean;
};

export const MorePresetsPopover = <TId extends string>({
  presets,
  value,
  onChange,
  hiddenCount,
  anchorRef,
  describedBy,
  isDisabled,
}: TMorePresetsPopoverProps<TId>) => {
  const t = useTranslations('presetPicker');
  const [isOpen, setIsOpen] = useState(false);
  const hasChosenRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { positioner, header, title, count } = morePresetsPopoverVariants();

  const choose = (id: TId) => {
    hasChosenRef.current = true;
    onChange(id);
    setIsOpen(false);
  };

  const focusAfterClose = () => {
    if (!hasChosenRef.current) {
      return true;
    }
    hasChosenRef.current = false;
    return (
      anchorRef.current?.querySelector<HTMLElement>(CHECKED_CHIP_SELECTOR) ??
      true
    );
  };

  const closeOnTab = (event: KeyboardEvent) => {
    if (event.key === KEY.TAB) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        disabled={isDisabled}
        aria-label={t('morePresetsAriaLabel', { count: hiddenCount })}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        className={morePresetsButtonVariants()}
      >
        <MorePresetsLabel hiddenCount={hiddenCount} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          anchor={anchorRef}
          side="bottom"
          align="start"
          sideOffset={8}
          className={positioner()}
        >
          <Popover.Popup
            initialFocus={listRef}
            finalFocus={focusAfterClose}
            onKeyDown={closeOnTab}
            className={menuSurfaceVariants().popup({ class: 'p-0' })}
          >
            <div className={header()}>
              <Popover.Title id={titleId} className={title()}>
                {t('choosePreset')}
              </Popover.Title>
              <span className={count()}>
                {t('presetCount', { count: presets.length })}
              </span>
            </div>
            <PresetOptionList
              ref={listRef}
              presets={presets}
              value={value}
              onChoose={choose}
              labelledBy={titleId}
              layout={PRESET_LIST_LAYOUT.GRID}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
