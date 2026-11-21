import { BILLING_INTERVAL } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';
import { OWNER_NEWSLETTER_EMAIL } from '@worker/constants/owner-email';
import type {
  TOwnerNewsletterEmailCopy,
  TOwnerNewsletterMoveUp,
} from '@worker/utils/owner-email/owner-newsletter-copy-input';

function pausedSubject(siteName: string): string {
  return `Beitrags-E-Mails sind auf ${siteName} pausiert`;
}
const PAUSED_HEADING = 'Neue Beiträge werden nicht mehr per E-Mail versendet';
function nearClosing(
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>,
): TMaybeUndefined<string> {
  return (
    moveUp &&
    `Die Stufe bis ${moveUp.ceiling} kostet ${moveUp.extra} und gilt, sobald Sie sie wählen. Ohne Ihr Zutun ändert sich nichts.`
  );
}

export const OWNER_NEWSLETTER_EMAIL_COPY_DE: TOwnerNewsletterEmailCopy = {
  subscribersLabel: 'Abonnenten',
  emailsLabel: 'E-Mails diesen Monat',
  usageValue: (used, limit) => `${used} von ${limit}`,
  extraPrice: {
    [BILLING_INTERVAL.MONTHLY]: (price) => `${price} mehr pro Monat`,
    [BILLING_INTERVAL.YEARLY]: (price) => `${price} mehr pro Jahr`,
  },
  actionLabel: 'Abonnenten öffnen',
  footerLine: (siteName) =>
    `Sie erhalten diese E-Mail, weil Ihnen ${siteName} auf ${PLATFORM_EMAIL_BRAND_NAME} gehört.`,
  emails: {
    [OWNER_NEWSLETTER_EMAIL.BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      moveUp,
    }) => ({
      subject: `${siteName} nähert sich seinem Abonnentenlimit`,
      heading: 'Sie nähern sich Ihrem Abonnentenlimit',
      paragraphs: [
        `${siteName} hat ${activeCount} bestätigte Abonnenten, und die Stufe reicht bis ${bandCeiling}. Bei ${bandCeiling} werden neue Beiträge nicht mehr versendet, bis Sie eine Stufe höher gehen oder die Liste kleiner wird.`,
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
      subject: `${siteName} nähert sich seinem monatlichen E-Mail-Limit`,
      heading: 'Sie haben die meisten E-Mails dieses Monats verbraucht',
      paragraphs: [
        `${siteName} hat diesen Monat ${sent} von ${allowance} E-Mails versendet. Ein Beitrag geht nur raus, wenn er vollständig hineinpasst, und das Kontingent beginnt am ${resetDate} neu.`,
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
        `${siteName} hat die Stufe bis ${bandCeiling} Abonnenten überschritten, deshalb wurde „${postTitle}“ veröffentlicht, aber nicht versendet. Sobald Sie wieder innerhalb Ihrer Stufe sind, können Sie ihn mit Send emails beim Beitrag im Studio versenden. Beiträge werden weiterhin veröffentlicht, und Leser können sich weiterhin anmelden.`,
      ],
      closingLine: moveUp
        ? `Wechseln Sie zur Stufe bis ${moveUp.ceiling} (${moveUp.extra}), und Ihr nächster Beitrag wird versendet – oder bringen Sie die Liste wieder unter ${bandCeiling}.`
        : `Bringen Sie die Liste wieder unter ${bandCeiling}, und Ihr nächster Beitrag wird versendet.`,
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
        `${siteName} hat die ${allowance} E-Mails dieses Monats verbraucht, deshalb wurde „${postTitle}“ veröffentlicht, aber nicht versendet. Der Versand startet am ${resetDate} wieder; sobald das Kontingent reicht, können Sie den Beitrag mit Send emails im Studio versenden.`,
      ],
      closingLine:
        moveUp &&
        `Wechseln Sie zur Stufe bis ${moveUp.ceiling} (${moveUp.extra}), und Ihr nächster Beitrag wird versendet – oder warten Sie bis zum ${resetDate}.`,
    }),
  },
};
