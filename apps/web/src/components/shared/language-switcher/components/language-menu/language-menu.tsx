'use client';

import { ICONS, LANGUAGE_SWITCHER_STYLE, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import type { TLanguageEntry } from '@web/components/shared/language-switcher/to-language-entries';
import { usePopover } from '@web/hooks/use-popover';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { languageMenuVariants } from './language-menu-variants';

type TLanguageMenuStyle =
  | typeof LANGUAGE_SWITCHER_STYLE.MENU_CODE
  | typeof LANGUAGE_SWITCHER_STYLE.MENU_GLOBE;

export type TLanguageMenuProps = {
  entries: TLanguageEntry[];
  menuStyle: TLanguageMenuStyle;
  isInFooter?: boolean;
};

export const LanguageMenu = ({
  entries,
  menuStyle,
  isInFooter = false,
}: TLanguageMenuProps) => {
  const t = useTranslations('languageSwitcher');
  const panelId = useId();
  const { open, toggle, close, triggerRef, panelRef } = usePopover();
  const current = entries.find((entry) => entry.isCurrent) ?? entries[0];
  const hasGlobe = menuStyle === LANGUAGE_SWITCHER_STYLE.MENU_GLOBE;
  const triggerKind = isInFooter ? 'text' : hasGlobe ? 'globe' : 'pill';
  const { trigger, caret, panel, checkSlot } = languageMenuVariants({
    trigger: triggerKind,
    opensUpward: isInFooter,
  });

  if (!current) {
    return null;
  }

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('menuAriaLabel', { language: current.label })}
        isOpen={open}
        panelId={panelId}
        onClick={toggle}
        variant={triggerKind === 'pill' ? 'bordered' : undefined}
        className={trigger()}
      >
        {hasGlobe && <Icon name={ICONS.GLOBE} size={SIZE.SM} />}
        {triggerKind === 'pill' && current.code}
        {isInFooter && current.label}
        {triggerKind !== 'globe' && (
          <span aria-hidden="true" className={caret()}>
            {isInFooter ? '▴' : '▾'}
          </span>
        )}
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        isOpen={open}
        ariaLabel={t('ariaLabel')}
        className={panel()}
      >
        {entries.map((entry) => (
          <PopoverMenu.Item
            key={entry.locale}
            as="a"
            href={entry.href}
            lang={entry.lang}
            hrefLang={entry.lang}
            aria-current={entry.isCurrent ? 'page' : undefined}
            onClick={close}
            icon={
              <span className={checkSlot()}>
                {entry.isCurrent && <Icon name={ICONS.CHECK} size={SIZE.SM} />}
              </span>
            }
          >
            {entry.label}
          </PopoverMenu.Item>
        ))}
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
};
