import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useTranslations } from 'next-intl';

import { leadPageSourceVariants } from './lead-page-source-variants';
import { useLeadPageTitle } from './use-lead-page-title';

const HOME_PATH = '/';

export type TLeadPageSourceProps = {
  lead: Pick<TInboxLead, 'sourcePath' | 'sourceDocumentId' | 'sourceLocale'>;
};

export const LeadPageSource = ({ lead }: TLeadPageSourceProps) => {
  const t = useTranslations('leadsInbox');
  const tLanguage = useTranslations('languageNames');
  const title = useLeadPageTitle(lead);
  const { sourcePath, sourceLocale } = lead;
  const { root, path } = leadPageSourceVariants();

  if (!title || !sourceLocale) {
    return (
      <span className={path()}>
        {sourcePath === HOME_PATH ? t('homePage') : sourcePath}
      </span>
    );
  }

  return (
    <span className={root()}>
      {title}
      <StatusBadge tone="neutral" hasDot={false}>
        {tLanguage(sourceLocale)}
      </StatusBadge>
    </span>
  );
};
