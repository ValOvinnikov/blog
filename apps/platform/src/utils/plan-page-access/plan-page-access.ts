import { CAPABILITY } from '@blog/config';
import {
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/db/constants';

export type TPlanPageAccess = {
  languages: boolean;
  email: boolean;
  subscribers: boolean;
  comments: boolean;
  team: boolean;
};

export type TPlanPage = keyof TPlanPageAccess;

const EMAIL_SENDING_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
];

export const planPageAccess = (plan: TTenantPlan): TPlanPageAccess => {
  const capabilities = PLAN_REGISTRY[plan];

  return {
    languages: PLAN_LOCALE_LIMIT[plan] > 1,
    email: EMAIL_SENDING_CAPABILITIES.some((capability) =>
      capabilities.includes(capability),
    ),
    subscribers: capabilities.includes(CAPABILITY.NEWSLETTER),
    comments: capabilities.includes(CAPABILITY.COMMENTS),
    team: plan !== TENANT_PLAN.FREE,
  };
};
