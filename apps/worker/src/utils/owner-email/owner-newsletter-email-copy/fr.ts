import { BILLING_INTERVAL } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';
import { OWNER_NEWSLETTER_EMAIL } from '@worker/constants/owner-email';
import type {
  TOwnerNewsletterEmailCopy,
  TOwnerNewsletterMoveUp,
} from '@worker/utils/owner-email/owner-newsletter-copy-input';

function pausedSubject(siteName: string): string {
  return `Les e-mails d’articles sont en pause sur ${siteName}`;
}
const PAUSED_HEADING = 'Les nouveaux articles ne sont plus envoyés par e-mail';
function nearClosing(
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>,
): TMaybeUndefined<string> {
  return (
    moveUp &&
    `La tranche de ${moveUp.ceiling} coûte ${moveUp.extra} et s’applique dès que vous la choisissez. Rien ne change sans votre accord.`
  );
}

export const OWNER_NEWSLETTER_EMAIL_COPY_FR: TOwnerNewsletterEmailCopy = {
  subscribersLabel: 'Abonnés',
  emailsLabel: 'E-mails ce mois-ci',
  usageValue: (used, limit) => `${used} sur ${limit}`,
  extraPrice: {
    [BILLING_INTERVAL.MONTHLY]: (price) => `${price} de plus par mois`,
    [BILLING_INTERVAL.YEARLY]: (price) => `${price} de plus par an`,
  },
  actionLabel: 'Ouvrir Abonnés',
  footerLine: (siteName) =>
    `Vous recevez ce message parce que vous êtes propriétaire de ${siteName} sur ${PLATFORM_EMAIL_BRAND_NAME}.`,
  emails: {
    [OWNER_NEWSLETTER_EMAIL.BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      moveUp,
    }) => ({
      subject: `${siteName} approche de sa limite d’abonnés`,
      heading: 'Vous approchez de votre limite d’abonnés',
      paragraphs: [
        `${siteName} compte ${activeCount} abonnés confirmés, et sa tranche est de ${bandCeiling}. Une fois ${bandCeiling} atteint, les nouveaux articles ne sont plus envoyés tant que vous ne passez pas à la tranche supérieure ou que la liste ne diminue pas.`,
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
      subject: `${siteName} approche de sa limite mensuelle d’e-mails`,
      heading: 'Vous avez utilisé la plupart des e-mails de ce mois',
      paragraphs: [
        `${siteName} a envoyé ${sent} de ses ${allowance} e-mails ce mois-ci. Un article n’est envoyé que s’il tient en entier, et le quota repart le ${resetDate}.`,
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
        `${siteName} a dépassé sa tranche de ${bandCeiling} abonnés : « ${postTitle} » a donc été publié sans être envoyé. Une fois revenu dans votre tranche, vous pourrez l’envoyer avec Send emails sur l’article dans le Studio. Les articles sont toujours publiés et les lecteurs peuvent toujours s’abonner.`,
      ],
      closingLine: moveUp
        ? `Passez à la tranche de ${moveUp.ceiling} (${moveUp.extra}) et votre prochain article sera envoyé, ou ramenez la liste sous ${bandCeiling}.`
        : `Ramenez la liste sous ${bandCeiling} et votre prochain article sera envoyé.`,
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
        `${siteName} a utilisé les ${allowance} e-mails de ce mois : « ${postTitle} » a donc été publié sans être envoyé. Les envois reprennent le ${resetDate} ; une fois que le quota le couvre, vous pourrez envoyer l’article avec Send emails dans le Studio.`,
      ],
      closingLine:
        moveUp &&
        `Passez à la tranche de ${moveUp.ceiling} (${moveUp.extra}) et votre prochain article sera envoyé, ou attendez le ${resetDate}.`,
    }),
  },
};
