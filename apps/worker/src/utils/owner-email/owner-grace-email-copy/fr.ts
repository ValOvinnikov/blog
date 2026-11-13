import { GRACE_EMAIL } from '@blog/db/constants';

import type { TOwnerGraceEmailCopy } from './owner-grace-email-copy-type';

export const OWNER_GRACE_EMAIL_COPY_FR: TOwnerGraceEmailCopy = {
  actionLabel: 'Ouvrir votre tableau de bord',
  upgradeAnyTime:
    'Vous pouvez passer à une offre supérieure à tout moment pour les réactiver.',
  keepAsTheyAre: (date) =>
    `Passez à une offre supérieure avant le ${date} pour tout conserver tel quel.`,
  memberLock: ({ count, date }) =>
    `Le ${date}, ${count} ${count === 1 ? 'membre de l’équipe perdra' : 'membres de l’équipe perdront'} l’accès à l’administration du site. Leurs comptes sont conservés et l’accès revient dès que vous passez à une offre supérieure.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Le ${date}, l’adresse principale de votre site passera de ${customDomain} à ${subdomain}.`,
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} est désormais sur l’offre gratuite`,
      previewText:
        'Passez à une offre supérieure pour réactiver les fonctionnalités de votre offre.',
      paragraphs: [
        `${siteName} est passé à l’offre gratuite, car sa période d’essai ou son offre payante a pris fin.`,
        'Les sections Growth, la newsletter, les comptes lecteurs et les réglages Look supplémentaires sont désactivés. Rien n’a été supprimé : tout revient dès que vous passez à une offre supérieure.',
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
};
