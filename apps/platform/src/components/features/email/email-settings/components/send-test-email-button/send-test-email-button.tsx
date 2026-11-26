'use client';

import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { ICONS, SIZE } from '@shinefold/config';
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
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { sendTest, isSending } = useSendTestEmail(tenantId);

  return (
    <Button
      type="button"
      size={SIZE.SM}
      variant={BUTTON_VARIANT.SECONDARY}
      onClick={() => sendTest(email)}
      isAriaDisabled={isArchived}
      aria-describedby={archivedDescribedBy}
      isPending={isSending}
      pendingLabel={t('sendingTest')}
    >
      <Icon name={ICONS.SEND} />
      {t('sendTest')}
    </Button>
  );
};
