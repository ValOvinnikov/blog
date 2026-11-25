import { GRACE_EMAIL } from '@shinefold/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_FR: TOwnerGraceEmailCopy = {
  upgradeAnyTime:
    'Rien n’a été supprimé. Vous pouvez passer à une offre supérieure à tout moment pour réactiver les fonctionnalités de votre offre.',
  keepAsTheyAre: (date) =>
    `Passez à une offre supérieure avant le ${date} pour tout conserver tel quel.`,
  memberLock: ({ count, date }) =>
    `Le ${date}, ${count} ${count === 1 ? 'membre de l’équipe perdra' : 'membres de l’équipe perdront'} l’accès à l’administration du site. Leurs comptes sont conservés et l’accès revient dès que vous passez à une offre supérieure.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Le ${date}, l’adresse principale de votre site passera de ${customDomain} à ${subdomain}.`,
  planComparisonLabel: 'Découvrez ce que comprend chaque offre',
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} est désormais sur l’offre gratuite`,
      previewText:
        'Passez à une offre supérieure pour réactiver les fonctionnalités de votre offre.',
      paragraphs: [
        `${siteName} est passé à l’offre gratuite, car sa période d’essai ou son offre payante a pris fin.`,
      ],
    }),
    [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
      subject: `${siteName} : plus qu’une semaine avant les limites de l’offre gratuite`,
      previewText: `Passez à une offre supérieure avant le ${date} pour garder votre équipe et votre adresse.`,
      paragraphs: [
        `${siteName} est passé à l’offre gratuite il y a une semaine.`,
      ],
    }),
    [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
      subject: `${siteName} : les limites de l’offre gratuite s’appliquent demain`,
      previewText:
        'Passez à une offre supérieure aujourd’hui pour garder votre équipe et votre adresse.',
      paragraphs: [
        `${siteName} est sur l’offre gratuite depuis presque deux semaines, et ses limites s’appliquent demain, le ${date}.`,
      ],
    }),
  },
  fewerSeats: {
    teamActionLabel: 'Ouvrir Équipe',
    memberLock: ({ members, date }) =>
      `Le ${date}, ces membres de l’équipe perdront l’accès à l’administration du site : ${members}. Leurs comptes sont conservés.`,
    closing: (date) =>
      `Pour choisir qui garde l’accès, retirez des membres sur la page Équipe avant le ${date}, ou passez à une offre avec plus de places.`,
    emails: {
      [GRACE_EMAIL.STARTED]: ({ siteName, date }) => ({
        subject: `${siteName} compte plus de membres que de places dans son offre`,
        previewText: `Choisissez qui garde l’accès avant le ${date}.`,
        paragraphs: [
          `${siteName} est passé à une offre avec moins de places, et son équipe dépasse désormais la limite.`,
        ],
      }),
      [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
        subject: `${siteName} : plus qu’une semaine avant que les membres en trop perdent l’accès`,
        previewText: `Retirez des membres ou changez d’offre avant le ${date}.`,
        paragraphs: [
          `${siteName} est passé à une offre avec moins de places il y a une semaine, et son équipe dépasse toujours la limite.`,
        ],
      }),
      [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
        subject: `${siteName} : les membres en trop perdent l’accès demain`,
        previewText: 'Choisissez aujourd’hui qui garde l’accès.',
        paragraphs: [
          `L’équipe de ${siteName} dépasse toujours les places de son offre, et la limite s’applique demain, le ${date}.`,
        ],
      }),
    },
  },
};
