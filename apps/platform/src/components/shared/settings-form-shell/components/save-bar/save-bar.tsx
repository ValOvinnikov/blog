'use client';

import { ICONS } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import { saveBarVariants } from './save-bar-variants';

export type TInvalidFields = {
  ids: string[];
  revealFirst?: () => void;
};

export type TSaveBarProps = {
  changeCount: number;
  breakdown: string;
  invalidFields: TInvalidFields;
  saveButtonLabel: string;
  savingButtonLabel: string;
  isPending: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  changeCount,
  breakdown,
  invalidFields,
  saveButtonLabel,
  savingButtonLabel,
  isPending,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
  const { ids: invalidFieldIds, revealFirst } = invalidFields;
  const [firstInvalidFieldId] = invalidFieldIds;
  const hasErrors = firstInvalidFieldId !== undefined;
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
    if (firstInvalidFieldId === undefined) return;
    event.preventDefault();
    if (revealFirst) flushSync(revealFirst);
    const target = document.getElementById(firstInvalidFieldId);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'center' });
  };

  return (
    <div role="region" aria-label={t('regionLabel')} className={root()}>
      <span className={summary()}>
        {hasErrors ? (
          <>
            <Icon name={ICONS.WARNING} />
            <span className={count()}>
              {t('fieldsNeedAttention', { count: invalidFieldIds.length })}
            </span>
            <a
              href={`#${firstInvalidFieldId}`}
              onClick={goToFirstField}
              className={errorLink()}
            >
              {t('goToFirstField')}
            </a>
          </>
        ) : (
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
          pendingLabel={savingButtonLabel}
          className={button()}
        >
          {saveButtonLabel}
        </Button>
      </div>
    </div>
  );
};
