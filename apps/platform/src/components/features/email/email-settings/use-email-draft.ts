'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { clearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { updateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { updateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import {
  blankToNull,
  EMAIL_SENDER_ITEM,
  withCopy,
  toSenderInput,
  withLogo,
  type TEmailDraft,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import {
  isSenderChanged,
  listCopyChanges,
  listLogoChanges,
} from '@platform/utils/email-draft-changes/email-draft-changes';
import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';
import { persistStagedImage } from '@platform/utils/staged-image/staged-image';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useState } from 'react';

type TUseEmailDraftArgs = {
  tenantId: string;
  initialDraft: TEmailDraft;
  liveLocales: TLocaleIsoCode[];
  onSaved: () => void;
};

const toLogoTarget = (target: TEmailPageItem): TEmailLogoTarget =>
  target === EMAIL_SENDER_ITEM
    ? { type: 'tenant' }
    : { type: 'template', templateType: target };

export const useEmailDraft = ({
  tenantId,
  initialDraft,
  liveLocales,
  onSaved,
}: TUseEmailDraftArgs) => {
  const [saved, setSaved] = useState(initialDraft);
  const [senderNameError, setSenderNameError] = useState<string>();

  const submission = useFormSubmission<TEmailDraft, { ok: boolean }>({
    initialValues: initialDraft,
    onSubmit: async (draft) => {
      let nextSaved = saved;
      let nextDraft = draft;

      const finish = (ok: boolean) => {
        setSaved(nextSaved);
        submission.setValues(nextDraft);
        return { ok };
      };

      for (const target of listLogoChanges(saved, draft)) {
        const logo =
          target === EMAIL_SENDER_ITEM
            ? draft.senderLogo
            : draft.templateLogos[target];
        const logoTarget = toLogoTarget(target);
        const result = await persistStagedImage(logo, {
          upload: (formData) =>
            uploadEmailLogoAction(tenantId, logoTarget, formData),
          clear: () => clearEmailLogoAction(tenantId, logoTarget),
        });
        if (!result.ok) return finish(false);

        nextSaved = withLogo(nextSaved, target, result.image);
        nextDraft = withLogo(nextDraft, target, result.image);
      }

      if (isSenderChanged(saved, draft)) {
        const result = await updateEmailConfigAction(
          tenantId,
          toSenderInput(draft.sender),
        );
        setSenderNameError(
          result.ok ? undefined : result.fieldErrors?.senderName,
        );
        if (!result.ok) return finish(false);
        nextSaved = { ...nextSaved, sender: draft.sender };
      }

      for (const change of listCopyChanges(saved, draft, liveLocales)) {
        const { subject, body } =
          draft.copies[change.templateType][change.locale];
        const trimmedSubject = blankToNull(subject);
        const result = await updateEmailTemplateAction(
          tenantId,
          change.templateType,
          change.locale,
          { subject: trimmedSubject, body },
        );
        if (!result.ok) return finish(false);

        const savedCopy = { subject: trimmedSubject ?? '', body };
        nextSaved = withCopy(nextSaved, change, savedCopy);
        nextDraft = withCopy(nextDraft, change, savedCopy);
      }

      onSaved();
      return finish(true);
    },
  });

  return { ...submission, saved, senderNameError, setSenderNameError };
};
