'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { useTranslations } from 'next-intl';

export type TCopyReferenceButtonProps = {
  reference: string;
};

export const CopyReferenceButton = ({
  reference,
}: TCopyReferenceButtonProps) => {
  const t = useTranslations('ownerSuspensionBanner');
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success({ message: t('copied') });
    } catch {
      toast.error({ message: t('copyFailed') });
    }
  };

  return (
    <Button variant={BUTTON_VARIANT.SECONDARY} size={SIZE.SM} onClick={copy}>
      {t('copyButton')}
    </Button>
  );
};
