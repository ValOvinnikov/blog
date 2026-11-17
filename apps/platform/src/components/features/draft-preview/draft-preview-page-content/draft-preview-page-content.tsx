import { DraftPreviewFrame } from '@platform/components/features/draft-preview/draft-preview-frame';
import { Alert } from '@platform/components/shared/alert';
import { DetailList } from '@platform/components/shared/detail-list';
import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import {
  DRAFT_PREVIEW_REFUSAL,
  type TDraftPreviewRefusal,
} from '@platform/constants/draft-preview';
import { resolveDraftPreview } from '@platform/server/draft-preview/resolve-draft-preview';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { ALERT_TYPE } from '@shinefold/config';
import { getTranslations } from 'next-intl/server';

const REFUSAL_MESSAGE_KEY = {
  [DRAFT_PREVIEW_REFUSAL.NOT_FOUND]: 'refusalNotFound',
  [DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF]: 'refusalLanguageOff',
  [DRAFT_PREVIEW_REFUSAL.SUSPENDED]: 'refusalSuspended',
  [DRAFT_PREVIEW_REFUSAL.ARCHIVED]: 'refusalArchived',
  [DRAFT_PREVIEW_REFUSAL.UNAVAILABLE]: 'refusalUnavailable',
} as const satisfies Record<TDraftPreviewRefusal, string>;

export type TDraftPreviewPageContentProps = {
  tenant: TPlatformTenant;
  documentId: string;
};

export const DraftPreviewPageContent = async ({
  tenant,
  documentId,
}: TDraftPreviewPageContentProps) => {
  const [preview, t] = await Promise.all([
    resolveDraftPreview(tenant, documentId),
    getTranslations('draftPreview'),
  ]);

  return (
    <PageStack>
      <PageHeader title={t('title')} description={t('draftNotice')} />
      {preview.isReady ? (
        <>
          <DetailList>
            <DetailList.Row label={t('siteLabel')} isMono={true}>
              {preview.siteUrl}
            </DetailList.Row>
            <DetailList.Row label={t('pathLabel')} isMono={true}>
              {preview.path}
            </DetailList.Row>
          </DetailList>
          <DraftPreviewFrame
            frameUrl={preview.frameUrl}
            publishedUrl={preview.publishedUrl}
          />
        </>
      ) : (
        <Alert
          type={
            preview.refusal === DRAFT_PREVIEW_REFUSAL.UNAVAILABLE
              ? ALERT_TYPE.ERROR
              : ALERT_TYPE.WARNING
          }
          title={t('refusedTitle')}
          description={t(REFUSAL_MESSAGE_KEY[preview.refusal])}
        />
      )}
    </PageStack>
  );
};
