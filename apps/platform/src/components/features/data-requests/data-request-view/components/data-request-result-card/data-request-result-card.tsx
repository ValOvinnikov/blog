'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const dataRequestResultCardVariants = tv({
  slots: {
    actions: ['flex flex-wrap items-center gap-2'],
  },
});

type TEraseOutcome = { ok: true } | { ok: false; error?: string };

export type TDataRequestResultCardProps = {
  email: string;
  matchCount: number;
  isExporting: boolean;
  onExport: () => void;
  onErase: () => Promise<TEraseOutcome>;
  onErased: () => void;
};

export const DataRequestResultCard = ({
  email,
  matchCount,
  isExporting,
  onExport,
  onErase,
  onErased,
}: TDataRequestResultCardProps) => {
  const t = useTranslations('dataRequestResultCard');
  const { actions } = dataRequestResultCardVariants();

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
              onClick={onExport}
              isPending={isExporting}
              pendingLabel={t('exporting')}
            >
              {t('export')}
            </Button>
            {matchCount > 0 && (
              <ConfirmDialog
                tone="danger"
                expectedValue={email}
                onConfirm={onErase}
                onConfirmed={onErased}
              >
                <ConfirmDialog.Trigger size={SIZE.SM}>
                  {t('erase')}
                </ConfirmDialog.Trigger>
                <ConfirmDialog.Content
                  title={t('eraseDialogTitle')}
                  description={t('eraseDialogDescription')}
                  confirmButtonLabel={t('eraseConfirm')}
                  confirmingButtonLabel={t('erasing')}
                />
              </ConfirmDialog>
            )}
          </div>
        }
      />
      <Card.Body>
        <Text>{t('matchCount', { count: matchCount })}</Text>
      </Card.Body>
    </Card>
  );
};
