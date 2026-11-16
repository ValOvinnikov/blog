import type { ILink } from '@shinefold/config';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { SmartLink } from '@web/components/shared/smart-link';

export const FooterLink = ({
  link: { label, href, target },
}: {
  link: ILink;
}) => (
  <TextLink appearance="nav" as={SmartLink} href={href} target={target}>
    {label}
  </TextLink>
);
