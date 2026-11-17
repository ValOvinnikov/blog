import { Alert } from '@platform/components/shared/alert';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ALERT_TYPE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { HelpForm } from './components/help-form';
import { helpViewVariants } from './help-view-variants';

export type THelpViewProps = {
  tenantId: string;
  isFormAvailable: boolean;
  originPath?: string;
  helpCentreUrl?: string;
};

export const HelpView = ({
  tenantId,
  isFormAvailable,
  originPath,
  helpCentreUrl,
}: THelpViewProps) => {
  const t = useTranslations('helpView');
  const { root } = helpViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          helpCentreUrl && (
            <ExternalLinkButton
              href={helpCentreUrl}
              variant={BUTTON_VARIANT.SECONDARY}
            >
              {t('helpCentre')}
            </ExternalLinkButton>
          )
        }
      />
      {isFormAvailable ? (
        <HelpForm tenantId={tenantId} originPath={originPath} />
      ) : (
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('unavailableTitle')}
          description={t('unavailableDescription')}
        />
      )}
    </div>
  );
};
