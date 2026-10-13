'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { reactivateTenantAction } from '@platform/server/provisioning/reactivate-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { reactivateTenantControlVariants } from './reactivate-tenant-control-variants';

export type TReactivateTenantControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name'>;
};

export const ReactivateTenantControl = ({
  tenant,
}: TReactivateTenantControlProps) => {
  const t = useTranslations('reactivateTenantControl');
  const router = useRouter();
  const reactivateTenant = useTenantLifecycleAction(reactivateTenantAction);
  const { id, name } = tenant;

  const { content } = reactivateTenantControlVariants();

  return (
    <Card>
      <Card.Header title={t('cardTitle')} />
      <Card.Body>
        <div className={content()}>
          <Text variant="muted">{t('description')}</Text>

          <ConfirmDialog
            tone="primary"
            expectedValue={name}
            onConfirm={(confirm) => reactivateTenant(id, { confirm })}
            onConfirmed={() => router.refresh()}
          >
            <ConfirmDialog.Trigger>{t('triggerButton')}</ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title={t('dialogTitle', { name })}
              description={t('dialogDescription')}
              confirmButtonLabel={t('confirmButton')}
              confirmingButtonLabel={t('confirmingButton')}
            />
          </ConfirmDialog>
        </div>
      </Card.Body>
    </Card>
  );
};
