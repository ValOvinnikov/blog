import type { TLocaleIsoCode } from '@blog/config';
import { useToast } from '@platform/context/toast-provider';
import type { TEmailDraft } from '@platform/utils/email-draft/email-draft';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useEmailChangeCounts } from './use-email-change-counts';
import { useEmailCopyDraftFields } from './use-email-copy-draft-fields';
import { useEmailDraft } from './use-email-draft';
import { useSenderFields } from './use-sender-fields';

type TUseEmailSettingsDraftArgs = {
  tenantId: string;
  initialDraft: TEmailDraft;
  liveLocales: TLocaleIsoCode[];
  savedAt?: Date;
  archivedAt?: Date;
  revealSenderName: () => void;
};

export const useEmailSettingsDraft = ({
  tenantId,
  initialDraft,
  liveLocales,
  savedAt,
  archivedAt,
  revealSenderName,
}: TUseEmailSettingsDraftArgs) => {
  const t = useTranslations('emailForm');
  const toast = useToast();
  const router = useRouter();
  const { senderFieldIds, senderDraftFields } = useSenderFields();
  const copyDraftFields = useEmailCopyDraftFields(liveLocales);
  const changeCounts = useEmailChangeCounts(liveLocales);
  const [revision, setRevision] = useState(0);

  const bumpRevision = () => setRevision((current) => current + 1);

  const emailDraft = useEmailDraft({
    tenantId,
    initialDraft,
    liveLocales,
    archivedAt,
    senderFieldIds,
    revealSenderName,
    onSaved: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    onDiscard: bumpRevision,
    ...changeCounts,
    draft: {
      tenantId,
      page: 'email',
      savedAt,
      fields: [...senderDraftFields, ...copyDraftFields],
      onRestore: (restored) => {
        emailDraft.setSenderFieldErrors({});
        emailDraft.setValues((prev) => ({
          ...restored,
          senderLogo: prev.senderLogo,
          templateLogos: prev.templateLogos,
        }));
        bumpRevision();
      },
    },
  });

  return { ...emailDraft, senderFieldIds, revision };
};
