'use client';

import { ICONS, SIZE } from '@blog/config';
import {
  EmailTemplatePreview,
  type TEmailPreviewWidth,
} from '@platform/components/features/email/email-template-preview';
import { Button } from '@platform/components/shared/button';
import { DetailList } from '@platform/components/shared/detail-list';
import { Icon } from '@platform/components/shared/icon';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { emailPreviewVariants } from './email-preview-variants';

export type TEmailPreviewProps = {
  html: string;
  from: string | undefined;
  replyTo: string | undefined;
  subject: string;
  onSendTest: () => void;
  isSendingTest: boolean;
  isSendTestDisabled: boolean;
  hasUnsavedLogo: boolean;
};

export const EmailPreview = ({
  html,
  from,
  replyTo,
  subject,
  onSendTest,
  isSendingTest,
  isSendTestDisabled,
  hasUnsavedLogo,
}: TEmailPreviewProps) => {
  const t = useTranslations('emailPreview');
  const [width, setWidth] = useState<TEmailPreviewWidth>('desktop');
  const { message, envelope } = emailPreviewVariants();

  return (
    <PreviewFrame
      ariaLabel={t('heading')}
      isNarrow={width === 'mobile'}
      widthControl={
        <SegmentedControl
          options={[
            { value: 'desktop', label: t('desktop') },
            { value: 'mobile', label: t('mobile') },
          ]}
          value={width}
          onChange={setWidth}
          ariaLabel={t('widthAriaLabel')}
        />
      }
      actions={
        <Button
          type="button"
          size={SIZE.SM}
          variant="secondary"
          onClick={onSendTest}
          isDisabled={isSendTestDisabled}
          isPending={isSendingTest}
          pendingLabel={t('sendingTest')}
        >
          <Icon name={ICONS.SEND} size={SIZE.SM} />
          {t('sendTest')}
        </Button>
      }
      notes={
        <>
          <p>{t('actionLockedNote')}</p>
          {hasUnsavedLogo && <p>{t('unsavedLogoNote')}</p>}
        </>
      }
    >
      <div className={message()}>
        <div className={envelope()}>
          <DetailList>
            <DetailList.Row label={t('fromLabel')}>
              {from || t('defaultSender')}
            </DetailList.Row>
            <DetailList.Row label={t('replyToLabel')}>
              {replyTo || t('noReplyTo')}
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
