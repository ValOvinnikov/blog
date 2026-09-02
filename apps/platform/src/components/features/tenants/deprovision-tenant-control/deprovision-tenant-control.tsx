'use client';

import { Switch } from '@base-ui/react/switch';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { deleteTenantAction } from '@platform/server/provisioning/delete-tenant-action';
import { deprovisionTenantAction } from '@platform/server/provisioning/deprovision-tenant-action';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { deprovisionTenantControlVariants } from './deprovision-tenant-control-variants';

export type TDeprovisionTenantControlProps = {
  tenant: TTenant;
};

/**
 * The tenant status page's danger-zone control. A live tenant gets a
 * confirm-dialog trigger requiring its name to be typed exactly, same
 * confirm-before-destructive-action posture as `deprovision-tenant.yml`
 * itself; there is no live progress feed after dispatch — the workflow
 * writes the tenant row directly, so the operator sees the result on a
 * later refresh. An already-archived tenant instead gets a read-only status
 * row plus the hard-delete escape hatch, confirmed the same way.
 */
export const DeprovisionTenantControl = ({
  tenant,
}: TDeprovisionTenantControlProps) => {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const {
    cardBorder,
    cardHeader,
    cardTitle,
    content,
    archivedRow,
    switchRow,
    switchTrack,
    switchThumb,
  } = deprovisionTenantControlVariants();

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
          title={<span className={cardTitle()}>{t('cardTitle')}</span>}
          headingLevel={2}
          className={cardHeader()}
        />
        <Card.Body>
          <div className={content()}>
            <div className={archivedRow()}>
              <StatusBadge tone="neutral">{t('archivedBadge')}</StatusBadge>
              <Text variant="muted">
                {t('archivedAt', { date: formatDate(tenant.deprovisionedAt) })}
              </Text>
            </div>
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
        headingLevel={2}
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
            confirmFieldId="deprovision-confirm"
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
          >
            <div className={switchRow()}>
              <Switch.Root
                checked={dryRun}
                onCheckedChange={setDryRun}
                aria-label={t('dryRunLabel')}
                className={switchTrack()}
              >
                <Switch.Thumb className={switchThumb()} />
              </Switch.Root>
              <span>{t('dryRunLabel')}</span>
            </div>
          </ConfirmDialog>
        </div>
      </Card.Body>
    </Card>
  );
};

/**
 * The archived branch's own trigger + confirm dialog, kept as a sibling
 * rather than folded into `DeprovisionTenantControl` itself so its
 * independent dialog/confirm state doesn't have to live alongside the
 * live-tenant dialog's.
 */
const DeleteTenantPermanentlyControl = ({ tenant }: { tenant: TTenant }) => {
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
      confirmFieldId="delete-tenant-confirm"
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
