'use client';

import { ICONS, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

import { useSendTestEmail, type TTestEmail } from './use-send-test-email';

type TSendTestEmailButtonProps = {
  tenantId: string;
  email: TTestEmail;
};

export const SendTestEmailButton = ({
  tenantId,
  email,
}: TSendTestEmailButtonProps) => {
  const t = useTranslations('emailPreview');
  const { isArchived } = useSettingsFormState();
  const { sendTest, isSending } = useSendTestEmail(tenantId);

  return (
    <Button
      type="button"
      size={SIZE.SM}
      variant="secondary"
      onClick={() => sendTest(email)}
      isDisabled={isArchived}
      isPending={isSending}
      pendingLabel={t('sendingTest')}
    >
      <Icon name={ICONS.SEND} />
      {t('sendTest')}
    </Button>
  );
};
