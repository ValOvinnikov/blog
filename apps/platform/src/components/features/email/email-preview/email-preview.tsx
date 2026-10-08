'use client';

import { SIZE } from '@blog/config';
import {
  EmailTemplatePreview,
  type TEmailPreviewWidth,
} from '@platform/components/features/email/email-template-preview';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
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
  const { root, body, note, footer } = emailPreviewVariants();

  return (
    <section className={root()} aria-label={t('heading')}>
      <Card>
        <Card.Header
          title={t('heading')}
          headingLevel={2}
          actions={
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
        />
        <Card.Body className={body()}>
          <DetailList>
            <DetailList.Row label={t('fromLabel')}>
              {from || t('defaultSender')}
            </DetailList.Row>
            <DetailList.Row label={t('replyToLabel')}>
              {replyTo || t('noReplyTo')}
            </DetailList.Row>
            <DetailList.Row label={t('subjectLabel')}>{subject}</DetailList.Row>
          </DetailList>
          <EmailTemplatePreview
            html={html}
            title={t('iframeTitle')}
            width={width}
          />
          <p className={note()}>{t('actionLockedNote')}</p>
          <div className={footer()}>
            <Button
              type="button"
              size={SIZE.SM}
              variant="secondary"
              onClick={onSendTest}
              isDisabled={isSendTestDisabled}
              isPending={isSendingTest}
              pendingLabel={t('sendingTest')}
            >
              {t('sendTest')}
            </Button>
            {hasUnsavedLogo && <p className={note()}>{t('unsavedLogoNote')}</p>}
          </div>
        </Card.Body>
      </Card>
    </section>
  );
};
