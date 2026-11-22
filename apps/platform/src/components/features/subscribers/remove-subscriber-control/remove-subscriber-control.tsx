'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SUBSCRIBERS_REFUSAL } from '@platform/constants/subscribers';
import { removeSubscriberAction } from '@platform/server/subscribers/remove-subscriber-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  ICONS,
  isOutcomeRefused,
  isOutcomeSuccess,
  SIZE,
} from '@shinefold/config';
import type { TConfirmedSubscriber } from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import { errorResult, okResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { removeSubscriberControlVariants } from './remove-subscriber-control-variants';

export type TRemoveSubscriberControlProps = {
  tenantId: string;
  subscriber: Pick<TConfirmedSubscriber, 'id' | 'email'>;
};

export const RemoveSubscriberControl = ({
  tenantId,
  subscriber,
}: TRemoveSubscriberControlProps) => {
  const t = useTranslations('subscribersPage.remove');
  const router = useRouter();
  const { id, email } = subscriber;
  const { email: emailSlot } = removeSubscriberControlVariants();

  const remove = async () => {
    const result = await settleAction(removeSubscriberAction(tenantId, id));
    if (isOutcomeSuccess(result)) return okResult();

    const isGone =
      isOutcomeRefused(result) &&
      result.reason === SUBSCRIBERS_REFUSAL.NOT_FOUND;
    return errorResult(t(isGone ? 'alreadyRemoved' : 'failed'));
  };

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.DANGER}
      onConfirm={remove}
      onConfirmed={() => router.refresh()}
    >
      <ConfirmDialog.Trigger
        variant={BUTTON_VARIANT.SECONDARY}
        size={SIZE.SM}
        icon={ICONS.X}
        ariaLabel={email ? t('trigger', { email }) : t('triggerUnknown')}
      />
      <ConfirmDialog.Content
        title={t('title')}
        description={
          <>
            {email && <span className={emailSlot()}>{email}</span>}
            {t('description')}
          </>
        }
        confirmButtonLabel={t('confirm')}
        confirmingButtonLabel={t('confirming')}
      />
    </ConfirmDialog>
  );
};
