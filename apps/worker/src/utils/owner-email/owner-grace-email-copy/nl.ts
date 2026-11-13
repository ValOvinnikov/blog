import { GRACE_EMAIL } from '@blog/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_NL: TOwnerGraceEmailCopy = {
  upgradeAnyTime: 'Je kunt op elk moment upgraden om ze weer aan te zetten.',
  keepAsTheyAre: (date) =>
    `Upgrade vóór ${date} om alles te houden zoals het is.`,
  memberLock: ({ count, date }) =>
    `Op ${date} verliezen ${count} ${count === 1 ? 'teamlid' : 'teamleden'} de toegang tot het beheer van de site. Hun accounts blijven bestaan en de toegang komt terug zodra je upgradet.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Op ${date} verhuist het hoofdadres van je site van ${customDomain} terug naar ${subdomain}.`,
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} staat nu op het gratis abonnement`,
      previewText:
        'Upgrade om de functies van je abonnement weer aan te zetten.',
      paragraphs: [
        `${siteName} is overgezet naar het gratis abonnement, omdat de proefperiode of het betaalde abonnement is afgelopen.`,
        'Growth-secties, de nieuwsbrief, lezersaccounts en de extra Look-instellingen zijn gestopt. Er is niets verwijderd: alles komt terug zodra je upgradet.',
      ],
    }),
    [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
      subject: `${siteName}: nog één week tot de limieten van het gratis abonnement gelden`,
      previewText: `Upgrade vóór ${date} om je team en je adres te houden.`,
      paragraphs: [
        `${siteName} is een week geleden overgezet naar het gratis abonnement.`,
      ],
    }),
    [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
      subject: `${siteName}: morgen gelden de limieten van het gratis abonnement`,
      previewText: 'Upgrade vandaag om je team en je adres te houden.',
      paragraphs: [
        `${siteName} staat bijna twee weken op het gratis abonnement, en morgen, ${date}, gaan de limieten in.`,
      ],
    }),
  },
};
