import { SIZE } from '@blog/config';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { tenantSiteUrl } from '@platform/utils/routes/routes';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

export type TConnectedDomainDetailsProps = {
  domain: string;
  isPlatformAddress: boolean;
};

export const ConnectedDomainDetails = ({
  domain,
  isPlatformAddress,
}: TConnectedDomainDetailsProps) => {
  const t = useTranslations('tenantDomainPage');

  return (
    <DetailList>
      <DetailList.Row
        label={t('addressLabel')}
        isMono={true}
        action={
          <ExternalLinkButton
            href={tenantSiteUrl(domain)}
            variant="ghost"
            size={SIZE.SM}
          >
            {t('visitSiteLink')}
          </ExternalLinkButton>
        }
      >
        {domain}
      </DetailList.Row>
      <DetailList.Row label={t('statusLabel')}>
        <StatusBadge
          tone={domainVerificationTone(DOMAIN_VERIFICATION_STATUS.VERIFIED)}
        >
          {t(`dnsStatus.${DOMAIN_VERIFICATION_STATUS.VERIFIED}`)}
        </StatusBadge>
      </DetailList.Row>
      <DetailList.Row label={t('lastCheckedLabel')}>
        {t('lastCheckedJustNow')}
      </DetailList.Row>
      <DetailList.Row label={t('domainTypeLabel')}>
        {isPlatformAddress ? t('platformAddress') : t('customDomain')}
      </DetailList.Row>
      <DetailList.Row label={t('httpsLabel')}>
        <StatusBadge tone="ok">{t('httpsActive')}</StatusBadge>
      </DetailList.Row>
    </DetailList>
  );
};
