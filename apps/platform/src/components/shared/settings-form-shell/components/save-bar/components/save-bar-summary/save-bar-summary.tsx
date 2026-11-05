import { hasArrayGotItems, isUndefined } from '@blog/utils/primitives';
import { FirstInvalidFieldLink } from '@platform/components/shared/settings-form-shell/components/save-bar/components/first-invalid-field-link/first-invalid-field-link';
import {
  SaveBarLocation,
  type TUnsavedCard,
} from '@platform/components/shared/settings-form-shell/components/save-bar/components/save-bar-location/save-bar-location';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';

import { saveBarSummaryVariants } from './save-bar-summary-variants';

type TSaveBarSummaryProps = {
  changeCount: number;
  breakdown: string;
  invalidControls: TInvalidControls;
  saveError?: string;
  unsavedCards?: TUnsavedCard[];
};

export const SaveBarSummary = ({
  changeCount,
  breakdown,
  invalidControls,
  saveError,
  unsavedCards,
}: TSaveBarSummaryProps) => {
  const t = useTranslations('saveBar');
  const { ids: invalidControlIds } = invalidControls;
  const {
    summary,
    count,
    breakdown: breakdownSlot,
    errorContent,
    errorCount,
    errorFollowUp,
    errorLink,
    separator,
    notSaved,
  } = saveBarSummaryVariants();

  if (!isUndefined(invalidControlIds[0])) {
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

  if (saveError) {
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
