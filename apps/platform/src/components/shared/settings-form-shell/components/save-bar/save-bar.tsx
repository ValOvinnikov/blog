'use client';

import { ICONS } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import { saveBarVariants } from './save-bar-variants';

const FIELD_CONTROL =
  'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

export type TInvalidControls = {
  ids: string[];
  revealFirst?: () => void;
};

export type TSaveBarProps = {
  changeCount: number;
  breakdown: string;
  invalidControls: TInvalidControls;
  saveError?: string;
  isPending: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  changeCount,
  breakdown,
  invalidControls,
  saveError,
  isPending,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
  const { ids: invalidControlIds, revealFirst } = invalidControls;
  const [firstInvalidControlId] = invalidControlIds;
  const hasInvalidFields = firstInvalidControlId !== undefined;
  const hasErrors = hasInvalidFields || saveError !== undefined;
  const {
    root,
    summary,
    dot,
    count,
    breakdown: breakdownSlot,
    errorLink,
    actions,
    shortcut,
    button,
  } = saveBarVariants({ hasErrors });

  const goToFirstField = (event: MouseEvent<HTMLAnchorElement>) => {
    if (firstInvalidControlId === undefined) return;
    event.preventDefault();
    if (revealFirst) flushSync(revealFirst);
    const target = document.getElementById(firstInvalidControlId);
    target?.focus({ preventScroll: true });
    if (target && !target.contains(document.activeElement)) {
      target
        .querySelector<HTMLElement>(FIELD_CONTROL)
        ?.focus({ preventScroll: true });
    }
    target?.scrollIntoView({ block: 'center' });
  };

  return (
    <div role="region" aria-label={t('regionLabel')} className={root()}>
      <span className={summary()}>
        {hasInvalidFields && (
          <>
            <Icon name={ICONS.WARNING} size={ICON_SIZE.XL} />
            {saveError !== undefined && (
              <span className={count()}>{t('notSaved')}</span>
            )}
            <span className={saveError === undefined ? count() : undefined}>
              {t('fieldsNeedAttention', { count: invalidControlIds.length })}
            </span>
            <a
              href={`#${firstInvalidControlId}`}
              onClick={goToFirstField}
              className={errorLink()}
            >
              {t('goToFirstField')}
            </a>
          </>
        )}
        {!hasInvalidFields && saveError !== undefined && (
          <>
            <Icon name={ICONS.WARNING} size={ICON_SIZE.XL} />
            <span role="alert" className={count()}>
              {saveError}
            </span>
          </>
        )}
        {!hasErrors && (
          <>
            <span aria-hidden="true" className={dot()} />
            <span className={count()}>
              {t('unsavedChanges', { count: changeCount })}
            </span>
            {breakdown && <span className={breakdownSlot()}>{breakdown}</span>}
          </>
        )}
      </span>
      <div className={actions()}>
        <kbd aria-hidden="true" className={shortcut()}>
          {t('shortcut')}
        </kbd>
        <Button onClick={onDiscard} isDisabled={isPending} className={button()}>
          {t('discard')}
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          isPending={isPending}
          pendingLabel={t('saving')}
          className={button()}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
};
