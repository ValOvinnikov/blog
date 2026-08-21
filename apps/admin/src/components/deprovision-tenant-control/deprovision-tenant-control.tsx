'use client';

import { deleteTenantAction } from '@admin/server/provisioning/delete-tenant-action';
import { deprovisionTenantAction } from '@admin/server/provisioning/deprovision-tenant-action';
import { formatDate } from '@admin/utils/format-date/format-date';
import { adminRoutes } from '@admin/utils/routes/routes';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Switch } from '@base-ui/react/switch';
import { ALERT_TYPE, Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Text } from '@blog/ui/atoms/text';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { deprovisionTenantControlVariants } from './deprovision-tenant-control-variants';

export type TDeprovisionTenantControlProps = {
  tenant: TTenant;
};

/**
 * The tenant status page's danger-zone control. A live tenant gets a
 * confirm-dialog trigger requiring its slug to be typed exactly, same
 * confirm-before-destructive-action posture as `deprovision-tenant.yml`
 * itself; there is no live progress feed after dispatch — the workflow
 * writes the tenant row directly, so the operator sees the result on a
 * later refresh. An already-archived tenant instead gets a read-only status
 * row plus the hard-delete escape hatch, confirmed on name rather than slug.
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
    card,
    archivedRow,
    backdrop,
    popup,
    title,
    popupDescription,
    field,
    label,
    hint,
    switchRow,
    switchTrack,
    switchThumb,
    actions,
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
      <div className={card()}>
        <Heading level={2} size={Size.XS}>
          {t('heading')}
        </Heading>
        <div className={archivedRow()}>
          <StatusBadge tone="neutral">{t('archivedBadge')}</StatusBadge>
          <Text variant="muted">
            {t('archivedAt', { date: formatDate(tenant.deprovisionedAt) })}
          </Text>
        </div>
        <Text variant="supporting">{t('deleteDescription')}</Text>
        <DeleteTenantPermanentlyControl tenant={tenant} />
      </div>
    );
  }

  return (
    <div className={card()}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>
      <Text variant="supporting">{t('description')}</Text>

      <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
        <AlertDialog.Trigger render={<Button type="button" variant="danger" />}>
          {t('triggerButton')}
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={backdrop()} />
          <AlertDialog.Popup className={popup()}>
            <AlertDialog.Title className={title()}>
              {t('dialogTitle', { name: tenant.name })}
            </AlertDialog.Title>
            <AlertDialog.Description className={popupDescription()}>
              {t('dialogDescription')}
            </AlertDialog.Description>

            {error && <Alert type={ALERT_TYPE.ERROR} message={error} />}

            <div className={field()}>
              <label className={label()} htmlFor="deprovision-confirm">
                {t('confirmLabel', { slug: tenant.slug })}
              </label>
              <TextInput
                id="deprovision-confirm"
                ariaLabel={t('confirmLabel', { slug: tenant.slug })}
                value={confirm}
                onChange={setConfirm}
              />
              <span className={hint()}>{t('confirmHint')}</span>
            </div>

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

            <div className={actions()}>
              <AlertDialog.Close
                render={<Button type="button" variant="ghost" />}
              >
                {t('cancelButton')}
              </AlertDialog.Close>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirm}
                isDisabled={isPending || confirm !== tenant.slug}
              >
                {isPending ? t('confirmingButton') : t('confirmButton')}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
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

  const {
    backdrop,
    popup,
    title,
    popupDescription,
    field,
    label,
    hint,
    actions,
  } = deprovisionTenantControlVariants();

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
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger render={<Button type="button" variant="danger" />}>
        {t('deleteTriggerButton')}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdrop()} />
        <AlertDialog.Popup className={popup()}>
          <AlertDialog.Title className={title()}>
            {t('deleteDialogTitle', { name: tenant.name })}
          </AlertDialog.Title>
          <AlertDialog.Description className={popupDescription()}>
            {t('deleteDialogDescription')}
          </AlertDialog.Description>

          {error && <Alert type={ALERT_TYPE.ERROR} message={error} />}

          <div className={field()}>
            <label className={label()} htmlFor="delete-tenant-confirm">
              {t('deleteConfirmLabel', { name: tenant.name })}
            </label>
            <TextInput
              id="delete-tenant-confirm"
              ariaLabel={t('deleteConfirmLabel', { name: tenant.name })}
              value={confirm}
              onChange={setConfirm}
            />
            <span className={hint()}>{t('deleteConfirmHint')}</span>
          </div>

          <div className={actions()}>
            <AlertDialog.Close
              render={<Button type="button" variant="ghost" />}
            >
              {t('cancelButton')}
            </AlertDialog.Close>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirm}
              isDisabled={isPending || confirm !== tenant.name}
            >
              {isPending
                ? t('deleteConfirmingButton')
                : t('deleteConfirmButton')}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
