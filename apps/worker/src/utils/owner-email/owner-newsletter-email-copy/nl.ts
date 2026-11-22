import { BILLING_INTERVAL } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';
import { OWNER_NEWSLETTER_EMAIL } from '@worker/constants/owner-email';
import type {
  TOwnerNewsletterEmailCopy,
  TOwnerNewsletterMoveUp,
} from '@worker/utils/owner-email/owner-newsletter-copy-input';

function pausedSubject(siteName: string): string {
  return `Berichtmails zijn gepauzeerd op ${siteName}`;
}
const PAUSED_HEADING = 'Nieuwe berichten worden niet meer gemaild';
function nearClosing(
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>,
): TMaybeUndefined<string> {
  return (
    moveUp &&
    `De schijf van ${moveUp.ceiling} kost ${moveUp.extra} en gaat in zodra je die kiest. Er verandert niets tenzij jij iets doet.`
  );
}

export const OWNER_NEWSLETTER_EMAIL_COPY_NL: TOwnerNewsletterEmailCopy = {
  subscribersLabel: 'Abonnees',
  emailsLabel: 'E-mails deze maand',
  usageValue: (used, limit) => `${used} van ${limit}`,
  extraPrice: {
    [BILLING_INTERVAL.MONTHLY]: (price) => `${price} per maand extra`,
    [BILLING_INTERVAL.YEARLY]: (price) => `${price} per jaar extra`,
  },
  actionLabel: 'Abonnees openen',
  footerLine: (siteName) =>
    `Je krijgt dit omdat je eigenaar bent van ${siteName} op ${PLATFORM_EMAIL_BRAND_NAME}.`,
  emails: {
    [OWNER_NEWSLETTER_EMAIL.BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      moveUp,
    }) => ({
      subject: `${siteName} nadert de abonneelimiet`,
      heading: 'Je nadert je abonneelimiet',
      paragraphs: [
        `${siteName} heeft ${activeCount} bevestigde abonnees en de schijf is ${bandCeiling}. Bij ${bandCeiling} worden nieuwe berichten niet meer gemaild, totdat je een schijf hoger gaat of de lijst kleiner wordt.`,
      ],
      closingLine: nearClosing(moveUp),
    }),
    [OWNER_NEWSLETTER_EMAIL.EMAILS_NEAR]: ({
      siteName,
      sent,
      allowance,
      resetDate,
      moveUp,
    }) => ({
      subject: `${siteName} nadert de maandelijkse e-maillimiet`,
      heading:
        'Je hebt het grootste deel van de e-mails van deze maand gebruikt',
      paragraphs: [
        `${siteName} heeft deze maand ${sent} van de ${allowance} e-mails verstuurd. Een bericht gaat alleen uit als het er helemaal in past, en het tegoed begint opnieuw op ${resetDate}.`,
      ],
      closingLine: nearClosing(moveUp),
    }),
    [OWNER_NEWSLETTER_EMAIL.BAND_PAUSED]: ({
      siteName,
      bandCeiling,
      postTitle,
      moveUp,
    }) => ({
      subject: pausedSubject(siteName),
      heading: PAUSED_HEADING,
      paragraphs: [
        `${siteName} is over de schijf van ${bandCeiling} abonnees heen, dus ‘${postTitle}’ is gepubliceerd maar niet gemaild. Zodra je weer binnen je schijf zit, kun je het versturen met Send emails bij het bericht in de Studio. Berichten worden nog steeds gepubliceerd en lezers kunnen zich nog steeds aanmelden.`,
      ],
      closingLine: moveUp
        ? `Ga naar de schijf van ${moveUp.ceiling} (${moveUp.extra}) en je volgende bericht wordt gemaild, of breng de lijst terug onder ${bandCeiling}.`
        : `Breng de lijst terug onder ${bandCeiling} en je volgende bericht wordt gemaild.`,
    }),
    [OWNER_NEWSLETTER_EMAIL.EMAILS_PAUSED]: ({
      siteName,
      allowance,
      resetDate,
      postTitle,
      moveUp,
    }) => ({
      subject: pausedSubject(siteName),
      heading: PAUSED_HEADING,
      paragraphs: [
        `${siteName} heeft de ${allowance} e-mails van deze maand gebruikt, dus ‘${postTitle}’ is gepubliceerd maar niet gemaild. Het versturen start weer op ${resetDate}; zodra het tegoed het dekt, kun je het bericht versturen met Send emails in de Studio.`,
      ],
      closingLine:
        moveUp &&
        `Ga naar de schijf van ${moveUp.ceiling} (${moveUp.extra}) en je volgende bericht wordt gemaild, of wacht tot ${resetDate}.`,
    }),
  },
};
