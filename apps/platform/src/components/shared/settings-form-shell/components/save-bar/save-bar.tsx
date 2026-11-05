'use client';

import { SIZE } from '@blog/config';
import { hasArrayGotItems, isUndefined } from '@blog/utils/primitives';
import { Button } from '@platform/components/shared/button';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';

import { FirstInvalidFieldLink } from './components/first-invalid-field-link/first-invalid-field-link';
import { PhoneSaveFooter } from './components/phone-save-footer/phone-save-footer';
import {
  SaveBarLocation,
  type TUnsavedCard,
} from './components/save-bar-location/save-bar-location';
import { saveBarVariants } from './save-bar-variants';

export type TSaveBarProps = {
  changeCount: number;
  breakdown: string;
  invalidControls: TInvalidControls;
  isPending: boolean;
  saveError?: string;
  unsavedCards?: TUnsavedCard[];
  hasPhoneFooter?: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  changeCount,
  breakdown,
  invalidControls,
  isPending,
  saveError,
  unsavedCards,
  hasPhoneFooter,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
  const { ids: invalidControlIds } = invalidControls;
  const [firstInvalidControlId] = invalidControlIds;
  const hasInvalidFields = !isUndefined(firstInvalidControlId);
  const isDirty = changeCount > 0;
  const isSaveErrorShown = !hasInvalidFields && Boolean(saveError);
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
  } = saveBarVariants({ hasPhoneFooter });

  const renderSummary = () => {
    if (hasInvalidFields) {
      return (
        <div className={errorContent()}>
          <span className={errorCount()}>
            {t('fieldsNeedAttention', { count: invalidControlIds.length })}
          </span>
          <span className={errorFollowUp()}>
            <FirstInvalidFieldLink
              invalidControls={invalidControls}
              className={errorLink()}
            />
            <span aria-hidden="true" className={separator()}>
              ·
            </span>
            <span className={notSaved()}>{t('notSaved')}</span>
          </span>
        </div>
      );
    }
    if (isSaveErrorShown) {
      return (
        <div role="alert" className={errorContent()}>
          <span className={errorCount()}>{saveError}</span>
        </div>
      );
    }
    return (
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
    );
  };

  return (
    <>
      {isDirty && (
        <div
          role="region"
          aria-label={t('regionLabel')}
          aria-busy={isPending || undefined}
          className={root()}
        >
          {renderSummary()}
          <div className={actions()}>
            {!hasInvalidFields && !isSaveErrorShown && (
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
      )}
      {hasPhoneFooter && (
        <PhoneSaveFooter
          changeCount={changeCount}
          invalidControls={invalidControls}
          isPending={isPending}
          saveError={saveError}
          onSave={onSave}
        />
      )}
    </>
  );
};
