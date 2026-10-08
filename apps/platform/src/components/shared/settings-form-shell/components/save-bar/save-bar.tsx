'use client';

import { ICONS } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';

import { saveBarVariants } from './save-bar-variants';

export type TSaveBarProps = {
  changeCount: number;
  breakdown: string;
  invalidFieldIds: string[];
  saveButtonLabel: string;
  savingButtonLabel: string;
  isPending: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  changeCount,
  breakdown,
  invalidFieldIds,
  saveButtonLabel,
  savingButtonLabel,
  isPending,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
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

  return (
    <div role="region" aria-label={t('regionLabel')} className={root()}>
      <span className={summary()}>
        {hasErrors ? (
          <>
            <Icon name={ICONS.WARNING} />
            <span className={count()}>
              {t('fieldsNeedAttention', { count: invalidFieldIds.length })}
            </span>
            <a href={`#${firstInvalidFieldId}`} className={errorLink()}>
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
