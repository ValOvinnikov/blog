'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { deleteTenantAction } from '@platform/server/provisioning/delete-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { deleteTenantControlVariants } from './delete-tenant-control-variants';

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

  const { cardBorder, cardHeader, cardTitle, content } =
    deleteTenantControlVariants();

  return (
    <Card className={cardBorder()}>
      <Card.Header
        title={<span className={cardTitle()}>{t('archivedCardTitle')}</span>}
        className={cardHeader()}
      />
      <Card.Body>
        <div className={content()}>
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
        </div>
      </Card.Body>
    </Card>
  );
};
