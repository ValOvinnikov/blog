'use client';

import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  DATA_REQUEST_EXPORT_FORMAT,
  type TDataRequestExportFormat,
} from '@platform/constants/data-request';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { tv } from '@platform/utils/tv/tv';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

const dataRequestResultCardVariants = tv({
  slots: {
    actions: ['flex flex-wrap items-center gap-2'],
  },
});

export type TDataRequestResultCardProps = {
  email: string;
  matchCount: number;
  exportingFormat: TMaybeUndefined<TDataRequestExportFormat>;
  onExport: (link: HTMLAnchorElement, format: TDataRequestExportFormat) => void;
  eraseAction?: ReactNode;
};

export const DataRequestResultCard = ({
  email,
  matchCount,
  exportingFormat,
  onExport,
  eraseAction,
}: TDataRequestResultCardProps) => {
  const t = useTranslations('dataRequestResultCard');
  const { actions } = dataRequestResultCardVariants();
  const exportLinkRef = useRef<HTMLAnchorElement>(null);

  const handleExport = (format: TDataRequestExportFormat) => {
    if (exportLinkRef.current) onExport(exportLinkRef.current, format);
  };

  return (
    <Card>
      <Card.Header
        title={t('title', { email })}
        actions={
          <div className={actions()}>
            <Button
              type="button"
              variant={BUTTON_VARIANT.SECONDARY}
              size={SIZE.SM}
              focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
              onClick={() => handleExport(DATA_REQUEST_EXPORT_FORMAT.JSON)}
              isPending={exportingFormat === DATA_REQUEST_EXPORT_FORMAT.JSON}
              pendingLabel={t('exporting')}
            >
              {t('exportJson')}
            </Button>
            <Button
              type="button"
              variant={BUTTON_VARIANT.SECONDARY}
              size={SIZE.SM}
              focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
              onClick={() => handleExport(DATA_REQUEST_EXPORT_FORMAT.CSV)}
              isPending={exportingFormat === DATA_REQUEST_EXPORT_FORMAT.CSV}
              pendingLabel={t('exporting')}
            >
              {t('exportCsv')}
            </Button>
            {eraseAction}
          </div>
        }
      />
      <Card.Body>
        <Text>{t('matchCount', { count: matchCount })}</Text>
        <a ref={exportLinkRef} hidden={true} />
      </Card.Body>
    </Card>
  );
};
