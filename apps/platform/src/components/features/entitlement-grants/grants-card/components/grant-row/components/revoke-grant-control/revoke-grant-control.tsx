'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { GRANTS_CARD_HEADING_ID } from '@platform/constants/entitlement-grant';
import { useToast } from '@platform/context/toast-provider';
import { revokeEntitlementGrantAction } from '@platform/server/entitlement-grants/revoke-entitlement-grant-action';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import { useGrantAction } from '@platform/utils/use-grant-action/use-grant-action';
import { SIZE } from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TRevokeGrantControlProps = {
  target: TGrantTarget;
  grantId: string;
  itemLabel: string;
  isExpired: boolean;
};

export const RevokeGrantControl = ({
  target,
  grantId,
  itemLabel,
  isExpired,
}: TRevokeGrantControlProps) => {
  const t = useTranslations('revokeGrantControl');
  const router = useRouter();
  const toast = useToast();
  const copyKey = isExpired ? 'remove' : 'revoke';
  const { tenantId, tenantName } = target;
  const settle = useGrantAction(t(`${copyKey}.failed`));
  const values = { item: itemLabel, tenant: tenantName };

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.DANGER}
      returnFocusId={GRANTS_CARD_HEADING_ID}
      onConfirm={() => settle(revokeEntitlementGrantAction(tenantId, grantId))}
      onConfirmed={() => {
        toast.success({ message: t(`${copyKey}.done`, values) });
        router.refresh();
      }}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        ariaLabel={t(`${copyKey}.triggerAriaLabel`, values)}
      >
        {t(`${copyKey}.trigger`)}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t(`${copyKey}.title`, values)}
        description={t(`${copyKey}.description`, values)}
        confirmButtonLabel={t(`${copyKey}.confirmButton`)}
        confirmingButtonLabel={t(`${copyKey}.confirmingButton`)}
      />
    </ConfirmDialog>
  );
};
