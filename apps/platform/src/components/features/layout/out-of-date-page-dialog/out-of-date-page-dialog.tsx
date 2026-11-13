'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertDialogShell } from '@platform/components/shared/alert-dialog-shell';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useIsPageOutOfDate } from '@platform/utils/page-out-of-date/page-out-of-date';
import { reloadPage } from '@platform/utils/reload-page/reload-page';
import { useTranslations } from 'next-intl';

export const OutOfDatePageDialog = () => {
  const t = useTranslations('outOfDatePageDialog');
  const isPageOutOfDate = useIsPageOutOfDate();

  return (
    <AlertDialog.Root open={isPageOutOfDate}>
      <AlertDialogShell
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={reloadPage}>
            {t('reload')}
          </Button>
        }
      />
    </AlertDialog.Root>
  );
};
