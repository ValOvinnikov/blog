import type { TOwnerEmailText } from '@worker/utils/owner-email/owner-email-copy-types';

export type TGraceEmailBody = TOwnerEmailText & {
  action: { label: string; path: string };
};
