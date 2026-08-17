'use client';

import { deprovisionTenantAction } from '@admin/server/provisioning/deprovision-tenant-action';
import { formatDate } from '@admin/utils/format-date/format-date';
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
 * The tenant status page's danger-zone control. Already-archived tenants get
 * a read-only status row (no trigger); everyone else gets a confirm-dialog
 * trigger requiring the tenant's live slug to be typed exactly, same
 * confirm-before-destructive-action posture as `deprovision-tenant.yml`
 * itself. There is no live progress feed after dispatch — the workflow
 * writes the tenant row directly (no status-callback exists for
 * deprovisioning), so the operator sees the result on a later refresh.
 */
export function DeprovisionTenantControl({
  tenant,
}: TDeprovisionTenantControlProps) {
  const t = useTranslations('deprovisionTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const {
    card,
    description,
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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirm('');
      setDryRun(true);
      setError(undefined);
    }
  }

  function handleConfirm() {
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
  }

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
      </div>
    );
  }

  return (
    <div className={card()}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>
      <Text variant="muted" className={description()}>
        {t('description')}
      </Text>

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
                disabled={isPending || confirm !== tenant.slug}
              >
                {isPending ? t('confirmingButton') : t('confirmButton')}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
