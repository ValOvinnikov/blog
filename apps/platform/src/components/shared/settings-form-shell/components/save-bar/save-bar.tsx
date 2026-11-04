'use client';

import { SIZE } from '@blog/config';
import { hasArrayGotItems, isUndefined } from '@blog/utils/primitives';
import { Button } from '@platform/components/shared/button';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import {
  SaveBarLocation,
  type TUnsavedCard,
} from './components/save-bar-location/save-bar-location';
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
  isPending: boolean;
  unsavedCards?: TUnsavedCard[];
  isFloatingOnPhone?: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  changeCount,
  breakdown,
  invalidControls,
  isPending,
  unsavedCards,
  isFloatingOnPhone,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
  const { ids: invalidControlIds, revealFirst } = invalidControls;
  const [firstInvalidControlId] = invalidControlIds;
  const hasInvalidFields = !isUndefined(firstInvalidControlId);
  const {
    root,
    summary,
    count,
    breakdown: breakdownSlot,
    errorContent,
    errorCount,
    errorFollowUp,
    errorLink,
    separator,
    notSaved,
    actions,
    shortcut,
  } = saveBarVariants({ hasErrors: hasInvalidFields, isFloatingOnPhone });

  const goToFirstField = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isUndefined(firstInvalidControlId)) return;
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
    <div
      role="region"
      aria-label={t('regionLabel')}
      aria-busy={isPending || undefined}
      className={root()}
    >
      {hasInvalidFields ? (
        <div className={errorContent()}>
          <span className={errorCount()}>
            {t('fieldsNeedAttention', { count: invalidControlIds.length })}
          </span>
          <span className={errorFollowUp()}>
            <a
              href={`#${firstInvalidControlId}`}
              onClick={goToFirstField}
              className={errorLink()}
            >
              {t('goToFirstField')}
            </a>
            <span aria-hidden="true" className={separator()}>
              ·
            </span>
            <span className={notSaved()}>{t('notSaved')}</span>
          </span>
        </div>
      ) : (
        <span className={summary()}>
          <UnsavedDot isDecorative={true} />
          <span className={count()}>
            {t('unsavedChanges', { count: changeCount })}
          </span>
          {breakdown && <span className={breakdownSlot()}>{breakdown}</span>}
          {hasArrayGotItems(unsavedCards) && (
            <SaveBarLocation cards={unsavedCards} />
          )}
        </span>
      )}
      <div className={actions()}>
        {!hasInvalidFields && (
          <span aria-hidden="true" className={shortcut()}>
            {t('shortcut')}
          </span>
        )}
        <Button size={SIZE.LG} onClick={onDiscard} isDisabled={isPending}>
          {t('discard')}
        </Button>
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          size={SIZE.LG}
          onClick={onSave}
          isPending={isPending}
          pendingLabel={t('saving')}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
};
