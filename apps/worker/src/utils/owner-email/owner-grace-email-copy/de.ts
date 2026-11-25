import { GRACE_EMAIL } from '@shinefold/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_DE: TOwnerGraceEmailCopy = {
  upgradeAnyTime:
    'Nichts wurde gelöscht. Sie können jederzeit upgraden, um die Funktionen Ihres Tarifs wieder einzuschalten.',
  keepAsTheyAre: (date) =>
    `Upgraden Sie vor dem ${date}, damit alles so bleibt, wie es ist.`,
  memberLock: ({ count, date }) =>
    `Am ${date} ${count === 1 ? 'verliert 1 Teammitglied' : `verlieren ${count} Teammitglieder`} den Zugang zur Verwaltung der Website. Die Konten bleiben erhalten, und der Zugang kehrt zurück, sobald Sie upgraden.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Am ${date} wechselt die Hauptadresse Ihrer Website von ${customDomain} zurück zu ${subdomain}.`,
  planComparisonLabel: 'Sehen Sie, was jeder Tarif enthält',
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} ist jetzt im kostenlosen Tarif`,
      previewText:
        'Upgraden Sie, um die Funktionen Ihres Tarifs wieder einzuschalten.',
      paragraphs: [
        `${siteName} ist in den kostenlosen Tarif gewechselt, weil der Testzeitraum oder der bezahlte Tarif abgelaufen ist.`,
      ],
    }),
    [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
      subject: `${siteName}: noch eine Woche bis zu den Grenzen des kostenlosen Tarifs`,
      previewText: `Upgraden Sie vor dem ${date}, um Ihr Team und Ihre Adresse zu behalten.`,
      paragraphs: [
        `${siteName} ist vor einer Woche in den kostenlosen Tarif gewechselt.`,
      ],
    }),
    [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
      subject: `${siteName}: Ab morgen gelten die Grenzen des kostenlosen Tarifs`,
      previewText:
        'Upgraden Sie heute, um Ihr Team und Ihre Adresse zu behalten.',
      paragraphs: [
        `${siteName} ist seit fast zwei Wochen im kostenlosen Tarif, und ab morgen, dem ${date}, gelten seine Grenzen.`,
      ],
    }),
  },
  fewerSeats: {
    teamActionLabel: 'Team öffnen',
    memberLock: ({ members, date }) =>
      `Am ${date} verlieren diese Teammitglieder den Zugang zur Verwaltung der Website: ${members}. Die Konten bleiben erhalten.`,
    closing: (date) =>
      `Um selbst zu entscheiden, wer den Zugang behält, entfernen Sie vor dem ${date} Mitglieder auf der Seite Team oder wechseln Sie in einen Tarif mit mehr Plätzen.`,
    emails: {
      [GRACE_EMAIL.STARTED]: ({ siteName, date }) => ({
        subject: `${siteName} hat mehr Teammitglieder, als der Tarif Plätze hat`,
        previewText: `Entscheiden Sie vor dem ${date}, wer den Zugang behält.`,
        paragraphs: [
          `${siteName} ist in einen Tarif mit weniger Plätzen gewechselt, und das Team liegt jetzt über der Grenze.`,
        ],
      }),
      [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
        subject: `${siteName}: noch eine Woche, bis Teammitglieder über den Plätzen des Tarifs den Zugang verlieren`,
        previewText: `Entfernen Sie Mitglieder oder wechseln Sie den Tarif vor dem ${date}.`,
        paragraphs: [
          `${siteName} ist vor einer Woche in einen Tarif mit weniger Plätzen gewechselt, und das Team liegt noch immer über der Grenze.`,
        ],
      }),
      [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
        subject: `${siteName}: Teammitglieder über den Plätzen des Tarifs verlieren morgen den Zugang`,
        previewText: 'Entscheiden Sie heute, wer den Zugang behält.',
        paragraphs: [
          `Das Team von ${siteName} liegt noch immer über den Plätzen des Tarifs, und ab morgen, dem ${date}, gilt die Grenze.`,
        ],
      }),
    },
  },
};
