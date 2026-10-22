import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { INACTIVITY_STAGE } from '@blog/db/constants';

import type { TOwnerEmailText } from './owner-email-copy';

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

type TOwnerInactivityEmailCopy = Record<
  TOwnerInactivityEmail,
  TOwnerInactivityEmailText
> & { actionLabel: string };

export const OWNER_INACTIVITY_EMAIL_COPY = {
  [LOCALE_ISO_CODES.EN]: {
    actionLabel: 'Sign in',
    [INACTIVITY_STAGE.SUSPENSION_WARNING]: ({ siteName, siteUrl, date }) => ({
      subject: `${siteName} will be paused on ${date}`,
      previewText: 'Sign in to keep your site running.',
      paragraphs: [
        `We haven’t seen any activity on ${siteName} for more than three weeks, so we’ll pause it on ${date}.`,
        `While it’s paused, ${siteUrl} stays online for reading, but features such as forms and newsletter sign-ups switch off.`,
        'Sign in before then to keep it running.',
      ],
    }),
    [INACTIVITY_STAGE.DELETION_NOTICE]: ({ siteName, date }) => ({
      subject: `${siteName} will be deleted on ${date}`,
      previewText: 'Sign in to keep your site.',
      paragraphs: [
        `${siteName} is paused because no one has used it for a while.`,
        `We’ll delete it on ${date}, together with its content. This can’t be undone.`,
        'Sign in before then to keep it. Signing in brings it back online straight away.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.NL]: {
    actionLabel: 'Inloggen',
    [INACTIVITY_STAGE.SUSPENSION_WARNING]: ({ siteName, siteUrl, date }) => ({
      subject: `${siteName} wordt op ${date} gepauzeerd`,
      previewText: 'Log in om je site actief te houden.',
      paragraphs: [
        `We hebben al ruim drie weken geen activiteit gezien op ${siteName}, dus we pauzeren de site op ${date}.`,
        `Zolang de site gepauzeerd is, blijft ${siteUrl} online om te lezen, maar functies zoals formulieren en nieuwsbriefaanmeldingen staan uit.`,
        'Log voor die tijd in om je site actief te houden.',
      ],
    }),
    [INACTIVITY_STAGE.DELETION_NOTICE]: ({ siteName, date }) => ({
      subject: `${siteName} wordt op ${date} verwijderd`,
      previewText: 'Log in om je site te behouden.',
      paragraphs: [
        `${siteName} is gepauzeerd omdat niemand de site al een tijd heeft gebruikt.`,
        `We verwijderen de site op ${date}, samen met de inhoud. Dit kan niet ongedaan worden gemaakt.`,
        'Log voor die tijd in om de site te behouden. Zodra je inlogt, is hij meteen weer online.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.FR]: {
    actionLabel: 'Se connecter',
    [INACTIVITY_STAGE.SUSPENSION_WARNING]: ({ siteName, siteUrl, date }) => ({
      subject: `${siteName} sera mis en pause le ${date}`,
      previewText: 'Connectez-vous pour que votre site reste actif.',
      paragraphs: [
        `Nous n’avons constaté aucune activité sur ${siteName} depuis plus de trois semaines : nous le mettrons donc en pause le ${date}.`,
        `Pendant la pause, ${siteUrl} reste consultable, mais les fonctionnalités comme les formulaires et les inscriptions à la newsletter sont désactivées.`,
        'Connectez-vous d’ici là pour qu’il reste actif.',
      ],
    }),
    [INACTIVITY_STAGE.DELETION_NOTICE]: ({ siteName, date }) => ({
      subject: `${siteName} sera supprimé le ${date}`,
      previewText: 'Connectez-vous pour conserver votre site.',
      paragraphs: [
        `${siteName} est en pause, car personne ne l’a utilisé depuis un certain temps.`,
        `Nous le supprimerons le ${date}, avec son contenu. Cette action est irréversible.`,
        'Connectez-vous d’ici là pour le conserver : votre site sera aussitôt remis en ligne.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.DE]: {
    actionLabel: 'Anmelden',
    [INACTIVITY_STAGE.SUSPENSION_WARNING]: ({ siteName, siteUrl, date }) => ({
      subject: `${siteName} wird am ${date} pausiert`,
      previewText: 'Melden Sie sich an, damit Ihre Website aktiv bleibt.',
      paragraphs: [
        `Seit über drei Wochen gab es auf ${siteName} keine Aktivität. Deshalb pausieren wir die Website am ${date}.`,
        `Während der Pause bleibt ${siteUrl} lesbar, aber Funktionen wie Formulare und Newsletter-Anmeldungen sind abgeschaltet.`,
        'Melden Sie sich bis dahin an, damit sie aktiv bleibt.',
      ],
    }),
    [INACTIVITY_STAGE.DELETION_NOTICE]: ({ siteName, date }) => ({
      subject: `${siteName} wird am ${date} gelöscht`,
      previewText: 'Melden Sie sich an, um Ihre Website zu behalten.',
      paragraphs: [
        `${siteName} ist pausiert, weil die Website seit einiger Zeit nicht genutzt wurde.`,
        `Wir löschen sie am ${date} mitsamt ihren Inhalten. Das lässt sich nicht rückgängig machen.`,
        'Melden Sie sich bis dahin an, um sie zu behalten. Mit der Anmeldung ist sie sofort wieder online.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.ES]: {
    actionLabel: 'Iniciar sesión',
    [INACTIVITY_STAGE.SUSPENSION_WARNING]: ({ siteName, siteUrl, date }) => ({
      subject: `${siteName} se pausará el ${date}`,
      previewText: 'Inicie sesión para mantener su sitio activo.',
      paragraphs: [
        `No hemos visto actividad en ${siteName} desde hace más de tres semanas, así que lo pausaremos el ${date}.`,
        `Mientras esté en pausa, ${siteUrl} seguirá en línea para leerse, pero funciones como los formularios y las suscripciones al boletín quedarán desactivadas.`,
        'Inicie sesión antes de esa fecha para mantenerlo activo.',
      ],
    }),
    [INACTIVITY_STAGE.DELETION_NOTICE]: ({ siteName, date }) => ({
      subject: `${siteName} se eliminará el ${date}`,
      previewText: 'Inicie sesión para conservar su sitio.',
      paragraphs: [
        `${siteName} está en pausa porque nadie lo ha usado desde hace tiempo.`,
        `Lo eliminaremos el ${date}, junto con su contenido. No se puede deshacer.`,
        'Inicie sesión antes de esa fecha para conservarlo. Al iniciar sesión, volverá a estar en línea de inmediato.',
      ],
    }),
  },
} as const satisfies Record<TLocaleIsoCode, TOwnerInactivityEmailCopy>;
