import { CUSTOM_DOMAIN_TXT_LABEL } from '@platform/constants/custom-domain';

export const customDomainTxtName = (domain: string) =>
  `${CUSTOM_DOMAIN_TXT_LABEL}.${domain}`;
