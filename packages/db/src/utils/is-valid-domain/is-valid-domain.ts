import { DOMAIN_PATTERN } from '@shinefold/config/constants';

export function isValidDomain(domain: string): boolean {
  return DOMAIN_PATTERN.test(domain);
}
