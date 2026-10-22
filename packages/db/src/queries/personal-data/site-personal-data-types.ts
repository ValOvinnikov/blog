import type { TMaybeUndefined } from '@blog/config/types';
import type { TMembershipRole } from '@blog/db/constants';
import type { TSubscriberStatus } from '@blog/db/schema/subscribers';

type TPersonalDataSite = {
  tenantId: string;
  tenantName: string;
};

type TPersonalDataSubscriber = TPersonalDataSite & {
  id: string;
  email: string;
  status: TSubscriberStatus;
  subscribedAt: Date;
  confirmedAt: TMaybeUndefined<Date>;
};

type TPersonalDataLead = TPersonalDataSite & {
  id: string;
  name: string;
  email: string;
  message: string;
  sourcePath: string;
  createdAt: Date;
};

type TPersonalDataInvite = TPersonalDataSite & {
  id: string;
  email: string;
  role: TMembershipRole;
  createdAt: Date;
  consumedAt: TMaybeUndefined<Date>;
};

export type TSitePersonalData = {
  subscribers: TPersonalDataSubscriber[];
  leads: TPersonalDataLead[];
  membershipInvites: TPersonalDataInvite[];
};
