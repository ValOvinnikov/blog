import { GRACE_EMAIL, TENANT_PLAN } from '@blog/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_DE: TOwnerGraceEmailCopy = {
  upgradeAnyTime: 'Sie können jederzeit upgraden, um sie wieder einzuschalten.',
  keepAsTheyAre: (date) =>
    `Upgraden Sie vor dem ${date}, damit alles so bleibt, wie es ist.`,
  memberLock: ({ count, date }) =>
    `Am ${date} ${count === 1 ? 'verliert 1 Teammitglied' : `verlieren ${count} Teammitglieder`} den Zugang zur Verwaltung der Website. Die Konten bleiben erhalten, und der Zugang kehrt zurück, sobald Sie upgraden.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `Am ${date} wechselt die Hauptadresse Ihrer Website von ${customDomain} zurück zu ${subdomain}.`,
  stopped: {
    [TENANT_PLAN.GROWTH]:
      'Growth-Bereiche, der Newsletter, Leserkonten und die zusätzlichen Look-Einstellungen sind abgeschaltet. Nichts wurde gelöscht: Alles kehrt zurück, sobald Sie upgraden.',
    [TENANT_PLAN.STARTER]:
      'Das Kontaktformular und Ihr eigenes Analysetool sind abgeschaltet, und der „Powered by“-Hinweis steht wieder in der Fußzeile. Nichts wurde gelöscht: Alles kehrt zurück, sobald Sie upgraden.',
  },
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
};
