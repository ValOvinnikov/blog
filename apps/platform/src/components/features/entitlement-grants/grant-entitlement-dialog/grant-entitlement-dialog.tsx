'use client';

import { GrantExpiryFields } from '@platform/components/features/entitlement-grants/grant-expiry-fields/grant-expiry-fields';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TEntitlementGrantInput } from '@platform/server/entitlement-grants/entitlement-grant-input-schema';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useGrantEntitlement } from './use-grant-entitlement';

type TGrantEntitlementDialogLabels = {
  trigger: string;
  triggerAriaLabel?: string;
  title: string;
  description: string;
  granted: string;
  failed: string;
};

export type TGrantEntitlementDialogProps = {
  tenantId: string;
  item: TMaybeUndefined<TEntitlementGrantInput['item']>;
  labels: TGrantEntitlementDialogLabels;
  returnFocusId: string;
  onClose?: () => void;
  children?: ReactNode;
};

export const GrantEntitlementDialog = ({
  tenantId,
  item,
  labels,
  returnFocusId,
  onClose,
  children,
}: TGrantEntitlementDialogProps) => {
  const t = useTranslations('grantDialog');
  const { trigger, triggerAriaLabel, title, description, granted, failed } =
    labels;
  const { fields, onOpenChange, onConfirm, onConfirmed } = useGrantEntitlement({
    tenantId,
    item,
    messages: { granted, failed },
    onClose,
  });

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.PRIMARY}
      onConfirm={onConfirm}
      onConfirmed={onConfirmed}
      onOpenChange={onOpenChange}
      returnFocusId={returnFocusId}
    >
      <ConfirmDialog.Trigger
        variant={BUTTON_VARIANT.SECONDARY}
        size={SIZE.SM}
        ariaLabel={triggerAriaLabel}
      >
        {trigger}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={title}
        description={description}
        confirmButtonLabel={t('confirmButton')}
        confirmingButtonLabel={t('confirmingButton')}
        isConfirmDisabled={!item}
      >
        {children}
        <GrantExpiryFields {...fields} />
      </ConfirmDialog.Content>
    </ConfirmDialog>
  );
};
