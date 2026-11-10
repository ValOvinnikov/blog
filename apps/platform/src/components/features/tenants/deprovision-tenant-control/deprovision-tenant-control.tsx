'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { deprovisionTenantAction } from '@platform/server/provisioning/deprovision-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { cardBodyStackClasses } from '@platform/utils/card-body-stack-classes/card-body-stack-classes';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
  const { id, name } = tenant;

  return (
    <Card isDanger={true}>
      <Card.Header title={t('cardTitle')} />
      <Card.Body className={cardBodyStackClasses()}>
        <Text variant="muted">{t('description')}</Text>

        <ConfirmDialog
          expectedValue={name}
          onConfirm={(confirm) => deprovisionTenant(id, { confirm })}
          onConfirmed={() => router.refresh()}
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
          />
        </ConfirmDialog>
      </Card.Body>
    </Card>
  );
};
