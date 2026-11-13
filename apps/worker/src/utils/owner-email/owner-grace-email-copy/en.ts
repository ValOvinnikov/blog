import { GRACE_EMAIL } from '@blog/db/constants';

import type { TOwnerGraceEmailCopy } from './owner-grace-email-copy-type';

export const OWNER_GRACE_EMAIL_COPY_EN: TOwnerGraceEmailCopy = {
  actionLabel: 'Open your dashboard',
  upgradeAnyTime: 'You can upgrade at any time to switch them back on.',
  keepAsTheyAre: (date) => `Upgrade before ${date} to keep things as they are.`,
  memberLock: ({ count, date }) =>
    `On ${date}, ${count} team ${count === 1 ? 'member' : 'members'} will lose access to the site’s admin. Their accounts are kept, and access comes back when you upgrade.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `On ${date}, your site’s main address moves from ${customDomain} back to ${subdomain}.`,
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} is now on the Free plan`,
      previewText: 'Upgrade to switch your plan’s features back on.',
      paragraphs: [
        `${siteName} has moved to the Free plan because its trial or paid plan has ended.`,
        'Growth sections, the newsletter, reader accounts and the extra Look settings have stopped. Nothing has been deleted: they come back as soon as you upgrade.',
      ],
    }),
    [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
      subject: `${siteName}: one week until the Free plan’s limits apply`,
      previewText: `Upgrade before ${date} to keep your team and your address.`,
      paragraphs: [`${siteName} moved to the Free plan a week ago.`],
    }),
    [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
      subject: `${siteName}: the Free plan’s limits apply tomorrow`,
      previewText: 'Upgrade today to keep your team and your address.',
      paragraphs: [
        `${siteName} has been on the Free plan for almost two weeks, and its limits apply tomorrow, ${date}.`,
      ],
    }),
  },
};
