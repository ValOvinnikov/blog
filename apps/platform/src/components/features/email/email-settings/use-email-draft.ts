'use client';

import {
  ACTION_OUTCOME,
  type TActionOutcome,
  type TLocaleIsoCode,
  type TOutcome,
} from '@blog/config';
import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from '@platform/components/shared/settings-form-shell';
import { clearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import {
  updateEmailConfigAction,
  type TSenderFieldErrors,
} from '@platform/server/email-config/update-email-config-action';
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
import { useState } from 'react';

type TUseEmailDraftArgs = Omit<
  TUseSettingsFormArgs<TEmailDraft, TOutcome<TActionOutcome>>,
  'initialValues' | 'onSubmit' | 'onSuccess' | 'invalidControls'
> & {
  tenantId: string;
  initialDraft: TEmailDraft;
  liveLocales: TLocaleIsoCode[];
  senderFieldIds: { senderName: string; contactRecipient: string };
  revealSenderName: () => void;
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
  senderFieldIds,
  revealSenderName,
  onSaved,
  onDiscard,
  ...settingsArgs
}: TUseEmailDraftArgs) => {
  const [senderFieldErrors, setSenderFieldErrors] =
    useState<TSenderFieldErrors>({});

  const settings = useSettingsForm<TEmailDraft, TOutcome<TActionOutcome>>({
    ...settingsArgs,
    initialValues: initialDraft,
    invalidControls: () => ({
      ids: [
        ...(senderFieldErrors.senderName ? [senderFieldIds.senderName] : []),
        ...(senderFieldErrors.contactRecipient
          ? [senderFieldIds.contactRecipient]
          : []),
      ],
      revealFirst: revealSenderName,
    }),
    onDiscard: () => {
      setSenderFieldErrors({});
      onDiscard?.();
    },
    onSuccess: onSaved,
    onSubmit: async (draft) => {
      const { savedValues: saved, setSavedValues, setValues } = settings;
      let nextSaved = saved;
      let nextDraft = draft;

      const finish = (outcome: TActionOutcome) => {
        setSavedValues(nextSaved);
        setValues(nextDraft);
        return { outcome };
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
        if (!result.ok) return finish(result.failure.outcome);

        nextSaved = withLogo(nextSaved, target, result.image);
        nextDraft = withLogo(nextDraft, target, result.image);
      }

      if (isSenderChanged(saved, draft)) {
        const result = await updateEmailConfigAction(
          tenantId,
          toSenderInput(draft.sender),
        );
        setSenderFieldErrors(
          result.outcome === ACTION_OUTCOME.INVALID ? result.fieldErrors : {},
        );
        if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
          return finish(result.outcome);
        }
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
        if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
          return finish(result.outcome);
        }

        const savedCopy = { subject: trimmedSubject ?? '', body };
        nextSaved = withCopy(nextSaved, change, savedCopy);
        nextDraft = withCopy(nextDraft, change, savedCopy);
      }

      return finish(ACTION_OUTCOME.SUCCESS);
    },
  });

  return { ...settings, senderFieldErrors, setSenderFieldErrors };
};
