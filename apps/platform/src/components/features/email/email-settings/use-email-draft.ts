'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { clearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { updateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { updateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import {
  EMAIL_SENDER_ITEM,
  isSenderChanged,
  listCopyChanges,
  listLogoChanges,
  withCopy,
  withLogo,
  type TEmailDraft,
} from '@platform/utils/email-draft/email-draft';
import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useState } from 'react';

type TUseEmailDraftArgs = {
  tenantId: string;
  initialDraft: TEmailDraft;
  liveLocales: TLocaleIsoCode[];
  onSaved: () => void;
};

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const toLogoTarget = (
  target: ReturnType<typeof listLogoChanges>[number],
): TEmailLogoTarget =>
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
        let url: string | undefined;

        if (logo.file) {
          const formData = new FormData();
          formData.append('file', logo.file);
          const result = await uploadEmailLogoAction(
            tenantId,
            toLogoTarget(target),
            formData,
          );
          if (!result.ok) return finish(false);
          url = result.url;
        } else {
          const result = await clearEmailLogoAction(
            tenantId,
            toLogoTarget(target),
          );
          if (!result.ok) return finish(false);
        }

        nextSaved = withLogo(nextSaved, target, { url });
        nextDraft = withLogo(nextDraft, target, { url });
      }

      if (isSenderChanged(saved, draft)) {
        const result = await updateEmailConfigAction(tenantId, {
          senderName: blankToNull(draft.sender.senderName),
          replyToAddress: blankToNull(draft.sender.replyToAddress),
          footerPostalAddress: blankToNull(draft.sender.footerPostalAddress),
        });
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
