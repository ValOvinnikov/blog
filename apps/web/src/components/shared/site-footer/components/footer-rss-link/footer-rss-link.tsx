import { ICONS, routes, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { SmartLink } from '@web/components/shared/smart-link';

type TFooterRssLinkProps = {
  label: string;
};

export const FooterRssLink = ({ label }: TFooterRssLinkProps) => (
  <TextLink
    appearance="nav"
    as={SmartLink}
    href={routes.rssFeed()}
    ariaLabel={label}
    title={label}
  >
    <Icon name={ICONS.RSS} size={SIZE.SM} dataTestId="rss-icon" />
  </TextLink>
);
