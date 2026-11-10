'use client';

import type { TLocaleIsoCode } from '@blog/config';
import {
  EmailSenderEditor,
  type TEmailSenderEditorProps,
} from '@platform/components/features/email/email-sender-editor';
import { EmailTemplateEditor } from '@platform/components/features/email/email-template-editor';
import type { TSenderFieldErrors } from '@platform/server/email-config/update-email-config-action';
import {
  EMAIL_SENDER_ITEM,
  withCopy,
  withLogo,
  type TEmailDraft,
  type TEmailPageItem,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { resolveFallbackCopy } from '@platform/utils/email-fallback-copy/email-fallback-copy';
import { useTranslations } from 'next-intl';

type TEmailEditPaneProps = {
  selection: { item: TEmailPageItem; locale: TLocaleIsoCode };
  defaultLocale: TLocaleIsoCode;
  draft: { values: TEmailDraft; saved: TEmailDraft; revision: number };
  senderFields: {
    ids: TEmailSenderEditorProps['fieldIds'];
    errors?: TSenderFieldErrors;
  };
  onSenderChange: (sender: TEmailSenderDraft) => void;
  onDraftChange: (update: (draft: TEmailDraft) => TEmailDraft) => void;
};

export const EmailEditPane = ({
  selection: { item, locale },
  defaultLocale,
  draft: { values: draft, saved, revision },
  senderFields,
  onSenderChange,
  onDraftChange,
}: TEmailEditPaneProps) => {
  const tLanguage = useTranslations('languageNames');

  if (item === EMAIL_SENDER_ITEM) {
    return (
      <EmailSenderEditor
        sender={draft.sender}
        logo={draft.senderLogo}
        onSenderChange={onSenderChange}
        onLogoStage={(logo) =>
          onDraftChange((prev) => withLogo(prev, EMAIL_SENDER_ITEM, logo))
        }
        fieldIds={senderFields.ids}
        fieldErrors={senderFields.errors}
      />
    );
  }

  return (
    <EmailTemplateEditor
      key={`${item}-${locale}-${revision}`}
      templateType={item}
      languageName={tLanguage(locale)}
      copy={{
        draft: draft.copies[item][locale],
        saved: saved.copies[item][locale],
        fallback: resolveFallbackCopy(draft, item, locale, defaultLocale),
      }}
      logo={draft.templateLogos[item]}
      onCopyChange={(copy) =>
        onDraftChange((prev) =>
          withCopy(prev, { templateType: item, locale }, copy),
        )
      }
      onLogoStage={(logo) =>
        onDraftChange((prev) => withLogo(prev, item, logo))
      }
    />
  );
};
