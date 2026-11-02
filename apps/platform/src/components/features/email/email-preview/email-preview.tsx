'use client';

import { EmailTemplatePreview } from '@platform/components/features/email/email-preview/components/email-template-preview';
import { DetailList } from '@platform/components/shared/detail-list';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { PREVIEW_WIDTH, type TPreviewWidth } from '@platform/constants/preview';
import type { TEmailSenderDraft } from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { emailPreviewVariants } from './email-preview-variants';

type TEmailPreviewProps = {
  html: string;
  sender: TEmailSenderDraft;
  subject: string;
  actions?: ReactNode;
  notes?: ReactNode;
};

export const EmailPreview = ({
  html,
  sender,
  subject,
  actions,
  notes,
}: TEmailPreviewProps) => {
  const t = useTranslations('emailPreview');
  const [width, setWidth] = useState<TPreviewWidth>(PREVIEW_WIDTH.DESKTOP);
  const { message, envelope } = emailPreviewVariants();

  return (
    <PreviewFrame
      ariaLabel={t('heading')}
      isNarrow={width === PREVIEW_WIDTH.MOBILE}
      widthControl={
        <SegmentedControl
          aria={{ label: t('widthAriaLabel') }}
          options={[
            { value: PREVIEW_WIDTH.DESKTOP, label: t('desktop') },
            { value: PREVIEW_WIDTH.MOBILE, label: t('mobile') },
          ]}
          value={width}
          onChange={setWidth}
        />
      }
      actions={actions}
      notes={
        <>
          <p>{t('actionLockedNote')}</p>
          {notes}
        </>
      }
    >
      <div className={message()}>
        <div className={envelope()}>
          <DetailList>
            <DetailList.Row label={t('fromLabel')}>
              {sender.senderName.trim() || t('defaultSender')}
            </DetailList.Row>
            <DetailList.Row label={t('replyToLabel')}>
              {sender.replyToAddress.trim() || t('noReplyTo')}
            </DetailList.Row>
            <DetailList.Row label={t('subjectLabel')}>{subject}</DetailList.Row>
          </DetailList>
        </div>
        <EmailTemplatePreview
          html={html}
          title={t('iframeTitle')}
          width={width}
        />
      </div>
    </PreviewFrame>
  );
};
