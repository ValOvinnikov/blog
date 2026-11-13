import { CheckMark } from '@platform/components/features/tenants/owner-home-view/components/get-started-card/components/check-mark/check-mark';
import { CopyButton } from '@platform/components/shared/copy-button';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';

import { liveSiteBlockVariants } from './live-site-block-variants';

export type TLiveSiteBlockProps = {
  siteAddress: string;
  siteUrl: string;
};

export const LiveSiteBlock = ({
  siteAddress,
  siteUrl,
}: TLiveSiteBlockProps) => {
  const t = useTranslations('getStartedCard');
  const { root, summary, text, title, address, actions, openSite } =
    liveSiteBlockVariants();

  return (
    <div className={root()}>
      <div className={summary()}>
        <CheckMark isDone={true} />
        <div className={text()}>
          <span className={title()}>{t('liveTitle')}</span>
          <span className={address()}>{siteAddress}</span>
        </div>
      </div>
      <div className={actions()}>
        <CopyButton value={siteUrl} ariaLabel={t('copyAddress')} />
        <ExternalLinkButton
          href={siteUrl}
          variant={BUTTON_VARIANT.PRIMARY}
          className={openSite()}
        >
          {t('openSite')}
        </ExternalLinkButton>
      </div>
    </div>
  );
};
