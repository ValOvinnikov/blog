'use client';

import {
  ENTITLEMENT_GRANT_EXPIRY,
  ENTITLEMENT_GRANT_NOTE_MAX_LENGTH,
  type TEntitlementGrantExpiry,
} from '@platform/constants/entitlement-grant';
import { useToast } from '@platform/context/toast-provider';
import type { TEntitlementGrantInput } from '@platform/server/entitlement-grants/entitlement-grant-input-schema';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { useGrantAction } from '@platform/utils/use-grant-action/use-grant-action';
import type { TMaybeUndefined } from '@shinefold/config';
import { errorResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type TUseGrantEntitlementArgs = {
  tenantId: string;
  item: TMaybeUndefined<TEntitlementGrantInput['item']>;
  messages: { granted: string; failed: string };
  onClose?: () => void;
};

export const useGrantEntitlement = ({
  tenantId,
  item,
  messages,
  onClose,
}: TUseGrantEntitlementArgs) => {
  const { granted, failed } = messages;
  const router = useRouter();
  const toast = useToast();
  const settle = useGrantAction(failed);
  const [expiry, setExpiry] = useState<TEntitlementGrantExpiry>(
    ENTITLEMENT_GRANT_EXPIRY.NEVER,
  );
  const [note, setNote] = useState('');

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) return;
    setExpiry(ENTITLEMENT_GRANT_EXPIRY.NEVER);
    setNote('');
    onClose?.();
  };

  const onConfirm = async () => {
    if (!item) return errorResult(failed);

    return settle(grantEntitlementAction(tenantId, { item, expiry, note }));
  };

  const onConfirmed = () => {
    toast.success({ message: granted });
    router.refresh();
  };

  return {
    fields: {
      expiry,
      onExpiryChange: setExpiry,
      note,
      onNoteChange: (value: string) =>
        setNote(value.slice(0, ENTITLEMENT_GRANT_NOTE_MAX_LENGTH)),
    },
    onOpenChange,
    onConfirm,
    onConfirmed,
  };
};
