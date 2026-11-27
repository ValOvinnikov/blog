'use client';

import { routes } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { ACCOUNT_EXPORT_FILE_NAME } from '@web/constants/account';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useToast } from '@web/context/toast-provider';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const fetchAccountExport = async () => {
  const response = await fetch(routes.accountExport());
  if (!response.ok) throw new Error(response.statusText);
  return response.blob();
};

const saveBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = ACCOUNT_EXPORT_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
};

export const ExportAccountDataControl = () => {
  const t = useTranslations('accountPage.privacy');
  const toast = useToast();
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        saveBlob(await fetchAccountExport());
      } catch {
        toast.error({ message: t('exportError') });
        return;
      }
      toast.success({ message: t('exportToastSuccessMessage') });
    });
  };

  return (
    <Button
      variant="ghost"
      isBusy={isPending}
      busyLabel={t('exportingLabel')}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
      onClick={handleExport}
    >
      {t('exportButton')}
    </Button>
  );
};
