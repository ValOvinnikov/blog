import { CAPABILITY } from '@shinefold/config';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TPlanPageAccess = {
  languages: boolean;
  email: boolean;
  leads: boolean;
  subscribers: boolean;
  team: boolean;
  billing: boolean;
};

export type TPlanPage = keyof TPlanPageAccess;

export const EVERY_PLAN_PAGE: TPlanPageAccess = {
  languages: true,
  email: true,
  leads: true,
  subscribers: true,
  team: true,
  billing: true,
};

const EMAIL_SENDING_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
  CAPABILITY.CONTACT_FORM,
];

export const entitlementPageAccess = ({
  capabilities,
  localeLimit,
  seats,
}: Pick<
  TTenantEntitlements,
  'capabilities' | 'localeLimit' | 'seats'
>): TPlanPageAccess => ({
  languages: localeLimit > 1,
  email: EMAIL_SENDING_CAPABILITIES.some((capability) =>
    capabilities.includes(capability),
  ),
  leads: capabilities.includes(CAPABILITY.CONTACT_FORM),
  subscribers: capabilities.includes(CAPABILITY.NEWSLETTER),
  team: seats > 1,
  billing: true,
});
