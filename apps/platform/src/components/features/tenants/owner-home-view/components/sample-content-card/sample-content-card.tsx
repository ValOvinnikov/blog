'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SAMPLE_CONTENT_HEADING_ID } from '@platform/constants/sample-content';
import type { TSampleContent } from '@platform/server/sample-content/sample-content-for';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { KeptSamples } from './components/kept-samples/kept-samples';
import { useSampleContentRemoval } from './use-sample-content-removal';

export type TSampleContentCardProps = {
  sampleContent: TSampleContent;
};

export const SampleContentCard = ({
  sampleContent: { tenantId, isWritable },
}: TSampleContentCardProps) => {
  const t = useTranslations('ownerHomePage.sampleContent');
  const { kept, onConfirm, onConfirmed } = useSampleContentRemoval(tenantId);

  return (
    <Card>
      <Card.Header
        title={t('title')}
        titleId={SAMPLE_CONTENT_HEADING_ID}
        titleTabIndex={-1}
        supportingText={t('supportingText')}
        actions={
          <ConfirmDialog
            returnFocusId={SAMPLE_CONTENT_HEADING_ID}
            onConfirm={onConfirm}
            onConfirmed={onConfirmed}
          >
            <ConfirmDialog.Trigger
              variant={BUTTON_VARIANT.SECONDARY}
              size={SIZE.SM}
              disabledReason={isWritable ? undefined : t('notWritable')}
            >
              {t('trigger')}
            </ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title={t('dialogTitle')}
              description={t('dialogDescription')}
              keepButtonLabel={t('keep')}
              confirmButtonLabel={t('confirm')}
              confirmingButtonLabel={t('confirming')}
            />
          </ConfirmDialog>
        }
      />
      {kept && (
        <Card.Body>
          <KeptSamples {...kept} />
        </Card.Body>
      )}
    </Card>
  );
};
