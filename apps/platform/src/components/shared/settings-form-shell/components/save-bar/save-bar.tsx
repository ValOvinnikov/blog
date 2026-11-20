'use client';

import { Button } from '@platform/components/shared/button';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIZE } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { type Ref, useRef } from 'react';

import {
  SaveBarSummary,
  type TSaveBarSummaryProps,
} from './components/save-bar-summary/save-bar-summary';
import { saveBarVariants } from './save-bar-variants';
import { useSaveBarHeight } from './use-save-bar-height';

export type TSaveBarProps = {
  ref?: Ref<HTMLDivElement>;
  changeCount: number;
  summary: Omit<TSaveBarSummaryProps, 'changeCount'>;
  isPending: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export const SaveBar = ({
  ref,
  changeCount,
  summary,
  isPending,
  onSave,
  onDiscard,
}: TSaveBarProps) => {
  const t = useTranslations('saveBar');
  const barRef = useRef<HTMLDivElement>(null);
  const { invalidControls, saveError } = summary;
  const isDirty = changeCount > 0;
  const isSummaryAnError =
    !isUndefined(invalidControls.ids[0]) || Boolean(saveError);
  const { container, root, actions, shortcut } = saveBarVariants();

  useSaveBarHeight(barRef, isDirty);

  return (
    <div ref={ref} className={container()}>
      {isDirty && (
        <div
          ref={barRef}
          role={ARIA_ROLE.REGION}
          aria-label={t('regionLabel')}
          aria-busy={isPending || undefined}
          className={root()}
        >
          <SaveBarSummary changeCount={changeCount} {...summary} />
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
    </div>
  );
};
