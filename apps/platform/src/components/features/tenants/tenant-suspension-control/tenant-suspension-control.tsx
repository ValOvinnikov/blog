'use client';

import { TENANT_STATUS } from '@blog/db/constants';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import {
  liftTenantSuspensionAction,
  suspendTenantAction,
} from '@platform/server/tenants/tenant-suspension-actions';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { tenantSuspensionControlVariants } from './tenant-suspension-control-variants';

export type TTenantSuspensionControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name' | 'status'>;
};

export const TenantSuspensionControl = ({
  tenant,
}: TTenantSuspensionControlProps) => {
  const t = useTranslations('tenantSuspensionControl');
  const router = useRouter();
  const suspendTenant = useTenantLifecycleAction(
    suspendTenantAction,
    'suspendFailed',
  );
  const liftSuspension = useTenantLifecycleAction(
    liftTenantSuspensionAction,
    'liftSuspensionFailed',
  );
  const { id, name, status } = tenant;
  const isSuspended = status === TENANT_STATUS.SUSPENDED;
  const copy = isSuspended ? 'suspended' : 'active';

  const { content } = tenantSuspensionControlVariants();

  return (
    <Card>
      <Card.Header title={t(`${copy}.cardTitle`)} />
      <Card.Body>
        <div className={content()}>
          <Text variant="muted">{t(`${copy}.description`)}</Text>

          <ConfirmDialog
            tone={isSuspended ? 'primary' : 'danger'}
            onConfirm={() =>
              isSuspended ? liftSuspension(id) : suspendTenant(id)
            }
            onConfirmed={() => router.refresh()}
          >
            <ConfirmDialog.Trigger>
              {t(`${copy}.triggerButton`)}
            </ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title={t(`${copy}.dialogTitle`, { name })}
              description={t(`${copy}.dialogDescription`)}
              confirmButtonLabel={t(`${copy}.confirmButton`)}
              confirmingButtonLabel={t(`${copy}.confirmingButton`)}
            />
          </ConfirmDialog>
        </div>
      </Card.Body>
    </Card>
  );
};
