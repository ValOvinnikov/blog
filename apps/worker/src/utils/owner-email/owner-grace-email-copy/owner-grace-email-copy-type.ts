import type { TGraceEmail } from '@blog/db/constants';
import type { TOwnerEmailText } from '@worker/utils/owner-email/owner-email-copy';

type TGraceEmailCopyInput = {
  siteName: string;
  date: string;
};

type TMemberLockInput = {
  count: number;
  date: string;
};

type TDomainLockInput = {
  customDomain: string;
  subdomain: string;
  date: string;
};

export type TOwnerGraceEmailCopy = {
  actionLabel: string;
  upgradeAnyTime: string;
  keepAsTheyAre: (date: string) => string;
  memberLock: (input: TMemberLockInput) => string;
  domainLock: (input: TDomainLockInput) => string;
  emails: Record<TGraceEmail, (input: TGraceEmailCopyInput) => TOwnerEmailText>;
};
