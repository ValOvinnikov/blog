import { GRACE_EMAIL } from '@shinefold/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_NL: TOwnerGraceEmailCopy = {
  upgradeAnyTime:
    'Er is niets verwijderd. Je kunt op elk moment upgraden om de functies van je abonnement weer aan te zetten.',
  keepAsTheyAre: (date) =>
    `Upgrade vóór ${date} om alles te houden zoals het is.`,
  memberLock: ({ count, date }) =>
    `Op ${date} verliezen ${count} ${count === 1 ? 'teamlid' : 'teamleden'} de toegang tot het beheer van de site. Hun accounts blijven bestaan en de toegang komt terug zodra je upgradet.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Op ${date} verhuist het hoofdadres van je site van ${customDomain} terug naar ${subdomain}.`,
  planComparisonLabel: 'Bekijk wat elk abonnement bevat',
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} staat nu op het gratis abonnement`,
      previewText:
        'Upgrade om de functies van je abonnement weer aan te zetten.',
      paragraphs: [
        `${siteName} is overgezet naar het gratis abonnement, omdat de proefperiode of het betaalde abonnement is afgelopen.`,
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
  fewerSeats: {
    teamActionLabel: 'Team openen',
    memberLock: ({ members, date }) =>
      `Op ${date} verliezen deze teamleden de toegang tot het beheer van de site: ${members}. Hun accounts blijven bestaan.`,
    closing: (date) =>
      `Kies zelf wie toegang houdt: verwijder vóór ${date} leden op de pagina Team, of stap over op een abonnement met meer plaatsen.`,
    emails: {
      [GRACE_EMAIL.STARTED]: ({ siteName, date }) => ({
        subject: `${siteName} heeft meer teamleden dan het abonnement plaatsen heeft`,
        previewText: `Kies vóór ${date} wie toegang houdt.`,
        paragraphs: [
          `${siteName} is overgestapt op een abonnement met minder plaatsen, en het team zit nu boven de limiet.`,
        ],
      }),
      [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
        subject: `${siteName}: nog één week tot teamleden boven de plaatsen van het abonnement hun toegang verliezen`,
        previewText: `Verwijder leden of wijzig je abonnement vóór ${date}.`,
        paragraphs: [
          `${siteName} is een week geleden overgestapt op een abonnement met minder plaatsen, en het team zit nog steeds boven de limiet.`,
        ],
      }),
      [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
        subject: `${siteName}: teamleden boven de plaatsen van het abonnement verliezen morgen hun toegang`,
        previewText: 'Kies vandaag wie toegang houdt.',
        paragraphs: [
          `Het team van ${siteName} zit nog steeds boven de plaatsen van het abonnement, en morgen, ${date}, gaat de limiet in.`,
        ],
      }),
    },
  },
};
