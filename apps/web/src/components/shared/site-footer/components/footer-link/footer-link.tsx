import type { ILink } from '@blog/config';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { SmartLink } from '@web/components/shared/smart-link';

export const FooterLink = ({
  link: { label, href, target, ariaLabel },
}: {
  link: ILink;
}) => (
  <TextLink
    appearance="nav"
    as={SmartLink}
    href={href}
    target={target}
    ariaLabel={ariaLabel}
  >
    {label}
  </TextLink>
);
