'use client';

import { deleteTenantAction } from '@admin/server/provisioning/delete-tenant-action';
import { adminRoutes } from '@admin/utils/routes/routes';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ALERT_TYPE, Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { deleteTenantControlVariants } from './delete-tenant-control-variants';

export type TDeleteTenantControlProps = {
  tenant: TTenant;
};

/**
 * The tenant status page's hard-delete control — only meaningful once a
 * tenant is archived, so the parent only ever renders this after
 * `deprovisionedAt` is set. Renders nothing if given a tenant that somehow
 * isn't (defense in depth, not the real gate: `deleteTenantAction`
 * re-checks the same precondition server-side), since a "should never
 * happen" trigger for a live tenant must be absent, not merely disabled.
 */
export function DeleteTenantControl({ tenant }: TDeleteTenantControlProps) {
  const t = useTranslations('deleteTenantControl');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const {
    card,
    backdrop,
    popup,
    title,
    popupDescription,
    field,
    label,
    hint,
    actions,
  } = deleteTenantControlVariants();

  if (!tenant.deprovisionedAt) {
    return null;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirm('');
      setError(undefined);
    }
  }

  function handleConfirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteTenantAction(tenant.id, { confirm });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(adminRoutes.tenants());
    });
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
              <label className={label()} htmlFor="delete-tenant-confirm">
                {t('confirmLabel', { name: tenant.name })}
              </label>
              <TextInput
                id="delete-tenant-confirm"
                ariaLabel={t('confirmLabel', { name: tenant.name })}
                value={confirm}
                onChange={setConfirm}
              />
              <span className={hint()}>{t('confirmHint')}</span>
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
                {isPending ? t('confirmingButton') : t('confirmButton')}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
