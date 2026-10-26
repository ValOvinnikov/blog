'use client';

import { SIZE } from '@blog/config';
import { DataRequestEraseDialog } from '@platform/components/features/data-requests/data-request-view/components/data-request-erase-dialog/data-request-erase-dialog';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

const dataRequestResultCardVariants = tv({
  slots: {
    actions: ['flex flex-wrap items-center gap-2'],
  },
});

export type TDataRequestResultCardProps = {
  email: string;
  matchCount: number;
  hasReaderAccount: boolean;
  hasSignupBlock: boolean;
  isExporting: boolean;
  onExport: (link: HTMLAnchorElement) => void;
  onErase: (
    includesReaderAccount: boolean,
  ) => Promise<TConfirmDialogActionResult>;
  onErased: () => void;
};

export const DataRequestResultCard = ({
  email,
  matchCount,
  hasReaderAccount,
  hasSignupBlock,
  isExporting,
  onExport,
  onErase,
  onErased,
}: TDataRequestResultCardProps) => {
  const t = useTranslations('dataRequestResultCard');
  const { actions } = dataRequestResultCardVariants();
  const exportLinkRef = useRef<HTMLAnchorElement>(null);

  const handleExport = () => {
    if (exportLinkRef.current) onExport(exportLinkRef.current);
  };

  return (
    <Card>
      <Card.Header
        title={t('title', { email })}
        actions={
          <div className={actions()}>
            <Button
              type="button"
              variant="secondary"
              size={SIZE.SM}
              onClick={handleExport}
              isPending={isExporting}
              pendingLabel={t('exporting')}
            >
              {t('export')}
            </Button>
            {matchCount > 0 && (
              <DataRequestEraseDialog
                email={email}
                hasReaderAccount={hasReaderAccount}
                hasSignupBlock={hasSignupBlock}
                onErase={onErase}
                onErased={onErased}
              />
            )}
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
