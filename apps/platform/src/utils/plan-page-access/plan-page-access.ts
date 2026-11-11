import { CAPABILITY } from '@blog/config';
import {
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  type TTenantPlan,
} from '@blog/db/constants';

export type TPlanPageAccess = {
  languages: boolean;
  email: boolean;
  leads: boolean;
  subscribers: boolean;
  team: boolean;
};

export type TPlanPage = keyof TPlanPageAccess;

const EMAIL_SENDING_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
  CAPABILITY.CONTACT_FORM,
];

export const planPageAccess = (plan: TTenantPlan): TPlanPageAccess => {
  const capabilities = PLAN_REGISTRY[plan];

  return {
    languages: PLAN_LOCALE_LIMIT[plan] > 1,
    email: EMAIL_SENDING_CAPABILITIES.some((capability) =>
      capabilities.includes(capability),
    ),
    leads: capabilities.includes(CAPABILITY.CONTACT_FORM),
    subscribers: capabilities.includes(CAPABILITY.NEWSLETTER),
    team: PLAN_ENTITLEMENTS[plan].seats > 1,
  };
};
