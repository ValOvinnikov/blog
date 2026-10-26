'use client';

import { isOutcomeSuccess, type TMaybeUndefined } from '@blog/config';
import {
  DATA_REQUEST_EXPORT_FILE_NAME,
  DATA_REQUEST_EXPORT_FORMAT,
  type TDataRequestExportFormat,
} from '@platform/constants/data-request';
import { useToast } from '@platform/context/toast-provider';
import {
  exportPersonalDataAction,
  type TPersonalDataExport,
} from '@platform/server/data-requests/export-personal-data-action';
import { downloadFile } from '@platform/utils/download-file/download-file';
import { toPersonalDataExportCsv } from '@platform/utils/personal-data-export-csv/personal-data-export-csv';
import { useState, useTransition } from 'react';

const JSON_INDENT = 2;

const SERIALIZE = {
  [DATA_REQUEST_EXPORT_FORMAT.JSON]: (data) =>
    JSON.stringify(data, null, JSON_INDENT),
  [DATA_REQUEST_EXPORT_FORMAT.CSV]: toPersonalDataExportCsv,
} satisfies Record<
  TDataRequestExportFormat,
  (data: TPersonalDataExport) => string
>;

export const useDataRequestExport = (exportFailed: string) => {
  const toast = useToast();
  const [isExporting, startExport] = useTransition();
  const [format, setFormat] = useState<TDataRequestExportFormat>(
    DATA_REQUEST_EXPORT_FORMAT.JSON,
  );

  const exportData = (
    email: string,
    link: HTMLAnchorElement,
    requestedFormat: TDataRequestExportFormat,
  ) => {
    setFormat(requestedFormat);
    startExport(async () => {
      const result = await exportPersonalDataAction({ email });

      if (isOutcomeSuccess(result)) {
        downloadFile(
          link,
          DATA_REQUEST_EXPORT_FILE_NAME[requestedFormat],
          SERIALIZE[requestedFormat](result.data),
        );
        return;
      }

      toast.error({ message: exportFailed });
    });
  };

  const exportingFormat: TMaybeUndefined<TDataRequestExportFormat> = isExporting
    ? format
    : undefined;

  return { exportingFormat, exportData };
};
