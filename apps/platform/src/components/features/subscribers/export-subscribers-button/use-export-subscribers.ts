'use client';

import { useToast } from '@platform/context/toast-provider';
import { exportSubscribersAction } from '@platform/server/subscribers/export-subscribers-action';
import { downloadFile } from '@platform/utils/download-file/download-file';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useRef, useTransition } from 'react';

export const useExportSubscribers = (tenantId: string) => {
  const t = useTranslations('subscribersPage');
  const toast = useToast();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isExporting, startExport] = useTransition();

  const exportList = () => {
    startExport(async () => {
      const result = await settleAction(exportSubscribersAction(tenantId));
      const link = linkRef.current;

      if (isOutcomeSuccess(result) && link) {
        const { fileName, csv } = result.data;
        downloadFile(link, fileName, csv);
        return;
      }

      toast.error({ message: t('exportFailed') });
    });
  };

  return { linkRef, isExporting, exportList };
};
