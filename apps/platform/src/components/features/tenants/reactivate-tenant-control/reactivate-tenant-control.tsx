'use client';

import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { reactivateTenantAction } from '@platform/server/provisioning/reactivate-tenant-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { reactivateTenantControlVariants } from './reactivate-tenant-control-variants';

export type TReactivateTenantControlProps = {
  tenant: TTenant;
};

/**
 * The danger page's recovery control for an archived tenant, offered
 * alongside the hard delete so a mistaken deprovision has a way back.
 */
export const ReactivateTenantControl = ({
  tenant,
}: TReactivateTenantControlProps) => {
  const t = useTranslations('reactivateTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const { content } = reactivateTenantControlVariants();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setConfirm('');
      setError(undefined);
    }
  };

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await reactivateTenantAction(tenant.id, { confirm });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <Card.Header title={t('cardTitle')} headingLevel={2} />
      <Card.Body>
        <div className={content()}>
          <Text variant="supporting">{t('description')}</Text>

          <ConfirmDialog
            tone="primary"
            isOpen={open}
            onOpenChange={handleOpenChange}
            triggerLabel={t('triggerButton')}
            title={t('dialogTitle', { name: tenant.name })}
            description={t('dialogDescription')}
            error={error}
            confirmFieldId="reactivate-confirm"
            confirmLabel={t('confirmLabel', { name: tenant.name })}
            confirmHint={t('confirmHint')}
            confirmValue={confirm}
            onConfirmValueChange={setConfirm}
            expectedValue={tenant.name}
            onConfirm={handleConfirm}
            isPending={isPending}
            confirmButtonLabel={t('confirmButton')}
            confirmingButtonLabel={t('confirmingButton')}
            cancelLabel={t('cancelButton')}
          />
        </div>
      </Card.Body>
    </Card>
  );
};
