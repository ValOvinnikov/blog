'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { reactivateTenantAction } from '@platform/server/provisioning/reactivate-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { cardBodyStackClasses } from '@platform/utils/card-body-stack-classes/card-body-stack-classes';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TReactivateTenantControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name'>;
};

export const ReactivateTenantControl = ({
  tenant,
}: TReactivateTenantControlProps) => {
  const t = useTranslations('reactivateTenantControl');
  const router = useRouter();
  const reactivateTenant = useTenantLifecycleAction(
    reactivateTenantAction,
    'reactivateFailed',
  );
  const { id, name } = tenant;

  return (
    <Card>
      <Card.Header title={t('cardTitle')} />
      <Card.Body className={cardBodyStackClasses()}>
        <Text variant="muted">{t('description')}</Text>

        <ConfirmDialog
          tone={BUTTON_VARIANT.PRIMARY}
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
      </Card.Body>
    </Card>
  );
};
