'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';

import { useExportSubscribers } from './use-export-subscribers';

export type TExportSubscribersButtonProps = {
  tenantId: string;
  isEmpty: boolean;
};

export const ExportSubscribersButton = ({
  tenantId,
  isEmpty,
}: TExportSubscribersButtonProps) => {
  const t = useTranslations('subscribersPage');
  const { linkRef, isExporting, exportList } = useExportSubscribers(tenantId);

  return (
    <>
      <Button
        variant={BUTTON_VARIANT.SECONDARY}
        isDisabled={isEmpty}
        isPending={isExporting}
        pendingLabel={t('exporting')}
        onClick={exportList}
      >
        {t('export')}
      </Button>
      <a ref={linkRef} hidden={true} />
    </>
  );
};
