'use client';

import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Switch } from '@platform/components/shared/switch';
import { Text } from '@platform/components/shared/text';
import { deleteTenantAction } from '@platform/server/provisioning/delete-tenant-action';
import { deprovisionTenantAction } from '@platform/server/provisioning/deprovision-tenant-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { deprovisionTenantControlVariants } from './deprovision-tenant-control-variants';

export type TDeprovisionTenantControlProps = {
  tenant: TClientTenant;
  isDeprovisioningInProgress?: boolean;
};

export const DeprovisionTenantControl = ({
  tenant,
  isDeprovisioningInProgress = false,
}: TDeprovisionTenantControlProps) => {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const inProgressHintId = useId();

  const { cardBorder, cardHeader, cardTitle, content } =
    deprovisionTenantControlVariants();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setConfirm('');
      setDryRun(true);
      setError(undefined);
    }
  };

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deprovisionTenantAction(tenant.id, {
        confirm,
        dryRun,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  };

  if (tenant.deprovisionedAt) {
    return (
      <Card className={cardBorder()}>
        <Card.Header
          title={<span className={cardTitle()}>{t('archivedCardTitle')}</span>}
          className={cardHeader()}
        />
        <Card.Body>
          <div className={content()}>
            <Text variant="supporting">{t('deleteDescription')}</Text>
            <DeleteTenantPermanentlyControl tenant={tenant} />
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={cardBorder()}>
      <Card.Header
        title={<span className={cardTitle()}>{t('cardTitle')}</span>}
        className={cardHeader()}
      />
      <Card.Body>
        <div className={content()}>
          <Text variant="supporting">{t('description')}</Text>

          <ConfirmDialog
            isOpen={open}
            onOpenChange={handleOpenChange}
            triggerLabel={t('triggerButton')}
            title={t('dialogTitle', { name: tenant.name })}
            description={t('dialogDescription')}
            error={error}
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
            isTriggerDisabled={isDeprovisioningInProgress}
            triggerAriaDescribedBy={
              isDeprovisioningInProgress ? inProgressHintId : undefined
            }
          >
            <Switch
              isChecked={dryRun}
              onCheckedChange={setDryRun}
              ariaLabel={t('dryRunLabel')}
              labels={{ caption: t('dryRunLabel') }}
            />
          </ConfirmDialog>

          {isDeprovisioningInProgress && (
            <Text id={inProgressHintId} variant="hint">
              {t('inProgressHint')}
            </Text>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

const DeleteTenantPermanentlyControl = ({
  tenant,
}: {
  tenant: TClientTenant;
}) => {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

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
      const result = await deleteTenantAction(tenant.id, { confirm });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(adminRoutes.tenants());
    });
  };

  return (
    <ConfirmDialog
      isOpen={open}
      onOpenChange={handleOpenChange}
      triggerLabel={t('deleteTriggerButton')}
      title={t('deleteDialogTitle', { name: tenant.name })}
      description={t('deleteDialogDescription')}
      error={error}
      confirmLabel={t('deleteConfirmLabel', { name: tenant.name })}
      confirmHint={t('deleteConfirmHint')}
      confirmValue={confirm}
      onConfirmValueChange={setConfirm}
      expectedValue={tenant.name}
      onConfirm={handleConfirm}
      isPending={isPending}
      confirmButtonLabel={t('deleteConfirmButton')}
      confirmingButtonLabel={t('deleteConfirmingButton')}
      cancelLabel={t('cancelButton')}
    />
  );
};
