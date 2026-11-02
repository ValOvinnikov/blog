'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Switch } from '@platform/components/shared/switch';
import { Text } from '@platform/components/shared/text';
import { deprovisionTenantAction } from '@platform/server/provisioning/deprovision-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { deprovisionTenantControlVariants } from './deprovision-tenant-control-variants';

export type TDeprovisionTenantControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name'>;
  isDeprovisioningInProgress?: boolean;
};

export const DeprovisionTenantControl = ({
  tenant,
  isDeprovisioningInProgress = false,
}: TDeprovisionTenantControlProps) => {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const deprovisionTenant = useTenantLifecycleAction(
    deprovisionTenantAction,
    'deprovisionFailed',
  );
  const [isDryRun, setIsDryRun] = useState(true);
  const { id, name } = tenant;

  const { cardBorder, cardHeader, cardTitle, content } =
    deprovisionTenantControlVariants();

  return (
    <Card className={cardBorder()}>
      <Card.Header
        title={<span className={cardTitle()}>{t('cardTitle')}</span>}
        className={cardHeader()}
      />
      <Card.Body>
        <div className={content()}>
          <Text variant="muted">{t('description')}</Text>

          <ConfirmDialog
            expectedValue={name}
            onConfirm={(confirm) =>
              deprovisionTenant(id, { confirm, dryRun: isDryRun })
            }
            onConfirmed={() => router.refresh()}
            onOpenChange={(isOpen) => {
              if (!isOpen) setIsDryRun(true);
            }}
          >
            <ConfirmDialog.Trigger
              disabledReason={
                isDeprovisioningInProgress ? t('inProgressHint') : undefined
              }
            >
              {t('triggerButton')}
            </ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title={t('dialogTitle', { name })}
              description={t('dialogDescription')}
              confirmButtonLabel={t('confirmButton')}
              confirmingButtonLabel={t('confirmingButton')}
            >
              <Switch
                aria={{ label: t('dryRunLabel') }}
                isChecked={isDryRun}
                onCheckedChange={setIsDryRun}
                labels={{ caption: t('dryRunLabel') }}
              />
            </ConfirmDialog.Content>
          </ConfirmDialog>
        </div>
      </Card.Body>
    </Card>
  );
};
