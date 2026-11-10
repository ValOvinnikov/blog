'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { deleteTenantAction } from '@platform/server/provisioning/delete-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { cardBodyStackClasses } from '@platform/utils/card-body-stack-classes/card-body-stack-classes';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TDeleteTenantControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name'>;
};

export const DeleteTenantControl = ({ tenant }: TDeleteTenantControlProps) => {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const deleteTenant = useTenantLifecycleAction(
    deleteTenantAction,
    'deleteFailed',
  );
  const { id, name } = tenant;

  return (
    <Card isDanger={true}>
      <Card.Header title={t('archivedCardTitle')} />
      <Card.Body className={cardBodyStackClasses()}>
        <Text variant="muted">{t('deleteDescription')}</Text>

        <ConfirmDialog
          expectedValue={name}
          onConfirm={(confirm) => deleteTenant(id, { confirm })}
          onConfirmed={() => router.push(adminRoutes.tenants())}
        >
          <ConfirmDialog.Trigger>
            {t('deleteTriggerButton')}
          </ConfirmDialog.Trigger>
          <ConfirmDialog.Content
            title={t('deleteDialogTitle', { name })}
            description={t('deleteDialogDescription')}
            confirmButtonLabel={t('deleteConfirmButton')}
            confirmingButtonLabel={t('deleteConfirmingButton')}
          />
        </ConfirmDialog>
      </Card.Body>
    </Card>
  );
};
