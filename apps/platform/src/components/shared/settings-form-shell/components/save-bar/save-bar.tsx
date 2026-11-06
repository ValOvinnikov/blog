'use client';

import { SIZE } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';
import { type Ref, useRef } from 'react';

import { PhoneSaveFooter } from './components/phone-save-footer/phone-save-footer';
import type { TUnsavedCard } from './components/save-bar-location/save-bar-location';
import { SaveBarSummary } from './components/save-bar-summary/save-bar-summary';
import { saveBarVariants } from './save-bar-variants';
import { useSaveBarHeight } from './use-save-bar-height';

export type TSaveBarProps = {
  ref?: Ref<HTMLDivElement>;
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
  ref,
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
  const barRef = useRef<HTMLDivElement>(null);
  const phoneFooterRef = useRef<HTMLDivElement>(null);
  const isDirty = changeCount > 0;
  const isSummaryAnError =
    !isUndefined(invalidControls.ids[0]) || Boolean(saveError);
  const { container, root, actions, shortcut } = saveBarVariants({
    hasPhoneFooter,
  });

  useSaveBarHeight(barRef, phoneFooterRef, isDirty);

  return (
    <div ref={ref} className={container()}>
      {isDirty && (
        <div
          ref={barRef}
          role="region"
          aria-label={t('regionLabel')}
          aria-busy={isPending || undefined}
          className={root()}
        >
          <SaveBarSummary
            changeCount={changeCount}
            breakdown={breakdown}
            invalidControls={invalidControls}
            saveError={saveError}
            unsavedCards={unsavedCards}
          />
          <div className={actions()}>
            {!isSummaryAnError && (
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
          ref={phoneFooterRef}
          changeCount={changeCount}
          invalidControls={invalidControls}
          isPending={isPending}
          saveError={saveError}
          onSave={onSave}
        />
      )}
    </div>
  );
};
