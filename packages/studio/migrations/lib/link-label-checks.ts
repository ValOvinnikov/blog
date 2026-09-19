import { LINK_LABEL_MAX_LENGTH } from './link-label-max-length';

export type TLinkLabelSource = {
  label?: string;
};

export const hasMissingLabel = (link: TLinkLabelSource): boolean =>
  !link.label?.trim();

export const hasOversizedLabel = (link: TLinkLabelSource): boolean =>
  Boolean(link.label && link.label.length > LINK_LABEL_MAX_LENGTH);
