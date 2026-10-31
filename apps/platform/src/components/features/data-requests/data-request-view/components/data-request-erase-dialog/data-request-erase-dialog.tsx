'use client';

import { SIZE } from '@blog/config';
import { Checkbox } from '@platform/components/shared/checkbox';
import {
  ConfirmDialog,
  type TConfirmDialogActionResult,
} from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TDataRequestEraseDialogProps = {
  email: string;
  hasReaderAccount: boolean;
  hasSignupBlock: boolean;
  onErase: (
    includesReaderAccount: boolean,
  ) => Promise<TConfirmDialogActionResult>;
  onErased: () => void;
};

export const DataRequestEraseDialog = ({
  email,
  hasReaderAccount,
  hasSignupBlock,
  onErase,
  onErased,
}: TDataRequestEraseDialogProps) => {
  const t = useTranslations('dataRequestEraseDialog');
  const [includesReaderAccount, setIncludesReaderAccount] = useState(true);

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.DANGER}
      expectedValue={email}
      onConfirm={() => onErase(hasReaderAccount && includesReaderAccount)}
      onConfirmed={onErased}
    >
      <ConfirmDialog.Trigger size={SIZE.SM}>{t('erase')}</ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('title')}
        description={t('description')}
        confirmButtonLabel={t('confirm')}
        confirmingButtonLabel={t('erasing')}
      >
        {hasReaderAccount && (
          <>
            <Checkbox
              isChecked={includesReaderAccount}
              onCheckedChange={setIncludesReaderAccount}
              label={t('includesReaderAccount')}
            />
            <Text variant="hint">{t('readerAccountHint')}</Text>
          </>
        )}
        {hasSignupBlock && <Text variant="hint">{t('signupBlockKept')}</Text>}
      </ConfirmDialog.Content>
    </ConfirmDialog>
  );
};
