import { DOMAIN_PATTERN } from '@blog/config/constants';

export function isValidDomain(domain: string): boolean {
  return DOMAIN_PATTERN.test(domain);
}
