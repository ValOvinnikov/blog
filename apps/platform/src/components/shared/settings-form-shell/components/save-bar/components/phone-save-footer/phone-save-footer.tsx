import { SIZE } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { Button } from '@platform/components/shared/button';
import { FirstInvalidFieldLink } from '@platform/components/shared/settings-form-shell/components/save-bar/components/first-invalid-field-link/first-invalid-field-link';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { phoneSaveFooterVariants } from './phone-save-footer-variants';

export type TPhoneSaveFooterProps = {
  changeCount: number;
  invalidControls: TInvalidControls;
  isPending: boolean;
  onSave: () => void;
};

export const PhoneSaveFooter = ({
  changeCount,
  invalidControls,
  isPending,
  onSave,
}: TPhoneSaveFooterProps) => {
  const t = useTranslations('saveBar');
  const statusId = useId();
  const { ids: invalidControlIds } = invalidControls;
  const hasInvalidFields = !isUndefined(invalidControlIds[0]);
  const isClean = changeCount === 0;
  const { root, status, link, save } = phoneSaveFooterVariants({
    hasErrors: hasInvalidFields,
  });

  const statusText = () => {
    if (hasInvalidFields) {
      return t('fieldsNeedAttention', { count: invalidControlIds.length });
    }
    if (isClean) {
      return t('allSaved');
    }
    return t('unsavedChanges', { count: changeCount });
  };

  return (
    <div
      role="region"
      aria-labelledby={statusId}
      aria-busy={isPending || undefined}
      className={root()}
    >
      {!hasInvalidFields && !isClean && <UnsavedDot isDecorative={true} />}
      <span id={statusId} className={status()}>
        {statusText()}
      </span>
      {hasInvalidFields && (
        <FirstInvalidFieldLink
          invalidControls={invalidControls}
          className={link()}
        />
      )}
      <Button
        variant={BUTTON_VARIANT.PRIMARY}
        size={SIZE.LG}
        onClick={onSave}
        isDisabled={isClean}
        isPending={isPending}
        pendingLabel={t('saving')}
        className={save()}
      >
        {t('save')}
      </Button>
    </div>
  );
};
