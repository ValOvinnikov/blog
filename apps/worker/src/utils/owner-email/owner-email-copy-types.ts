import {
  type INACTIVITY_STAGE,
  type TGraceEmail,
} from '@shinefold/db/constants';

type TOwnerEmailCopyInput = {
  siteName: string;
  siteUrl: string;
  ownerEmail: string;
};

export type TOwnerEmailText = {
  subject: string;
  previewText: string;
  paragraphs: string[];
};

type TOwnerEmailTextWithAction = TOwnerEmailText & { actionLabel: string };

export type TOwnerEmailCopy = {
  inviteHeadsUp: (input: TOwnerEmailCopyInput) => TOwnerEmailText;
  inviteNudge: (input: TOwnerEmailCopyInput) => TOwnerEmailTextWithAction;
  siteReady: (input: TOwnerEmailCopyInput) => TOwnerEmailTextWithAction;
};

type TOwnerInactivityEmailCopyInput = {
  siteName: string;
  siteUrl: string;
  date: string;
};

type TOwnerInactivityEmailText = (
  input: TOwnerInactivityEmailCopyInput,
) => TOwnerEmailText;

export type TOwnerInactivityEmail =
  | typeof INACTIVITY_STAGE.SUSPENSION_WARNING
  | typeof INACTIVITY_STAGE.DELETION_NOTICE;

export type TOwnerInactivityEmailCopy = Record<
  TOwnerInactivityEmail,
  TOwnerInactivityEmailText
> & { actionLabel: string };

type TGraceEmailCopyInput = {
  siteName: string;
  date: string;
};

type TMemberLockInput = {
  count: number;
  date: string;
};

type TNamedMemberLockInput = {
  members: string;
  date: string;
};

type TDomainLockInput = {
  customDomain: string;
  subdomain: string;
  date: string;
};

type TGraceEmails = Record<
  TGraceEmail,
  (input: TGraceEmailCopyInput) => TOwnerEmailText
>;

type TFewerSeatsGraceEmailCopy = {
  teamActionLabel: string;
  memberLock: (input: TNamedMemberLockInput) => string;
  closing: (date: string) => string;
  emails: TGraceEmails;
};

export type TOwnerGraceEmailCopy = {
  planComparisonLabel: string;
  upgradeAnyTime: string;
  keepAsTheyAre: (date: string) => string;
  memberLock: (input: TMemberLockInput) => string;
  domainLock: (input: TDomainLockInput) => string;
  emails: TGraceEmails;
  fewerSeats: TFewerSeatsGraceEmailCopy;
};
