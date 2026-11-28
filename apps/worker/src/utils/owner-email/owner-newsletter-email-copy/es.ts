import { BILLING_INTERVAL } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';
import { OWNER_NEWSLETTER_EMAIL } from '@worker/constants/owner-email';
import type {
  TOwnerNewsletterEmailCopy,
  TOwnerNewsletterMoveUp,
} from '@worker/utils/owner-email/owner-newsletter-copy-input';

function pausedSubject(siteName: string): string {
  return `Los correos de entradas están en pausa en ${siteName}`;
}
const PAUSED_HEADING = 'Las nuevas entradas ya no se envían por correo';
function nearClosing(
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>,
): TMaybeUndefined<string> {
  return (
    moveUp &&
    `El tramo de ${moveUp.ceiling} cuesta ${moveUp.extra} y empieza en cuanto lo eliges. Nada cambia a menos que tú lo decidas.`
  );
}

export const OWNER_NEWSLETTER_EMAIL_COPY_ES: TOwnerNewsletterEmailCopy = {
  subscribersLabel: 'Suscriptores',
  emailsLabel: 'Correos este mes',
  usageValue: (used, limit) => `${used} de ${limit}`,
  extraPrice: {
    [BILLING_INTERVAL.MONTHLY]: (price) => `${price} más al mes`,
    [BILLING_INTERVAL.YEARLY]: (price) => `${price} más al año`,
  },
  actionLabel: 'Abrir Suscriptores',
  footerLine: (siteName) =>
    `Recibes esto porque eres propietario de ${siteName} en ${PLATFORM_EMAIL_BRAND_NAME}.`,
  reputationPaused: (siteName) => ({
    subject: pausedSubject(siteName),
    heading: PAUSED_HEADING,
    paragraphs: [
      `Demasiados correos de ${siteName} rebotaron o se marcaron como spam, así que los envíos están en pausa para proteger su entrega. Las entradas se siguen publicando y los lectores pueden seguir suscribiéndose, pero las nuevas entradas no se envían por correo hasta que el equipo de soporte reanude los envíos.`,
    ],
    closingLine: 'Contacta con soporte para reanudar los envíos.',
  }),
  emails: {
    [OWNER_NEWSLETTER_EMAIL.BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      moveUp,
    }) => ({
      subject: `${siteName} se acerca a su límite de suscriptores`,
      heading: 'Te acercas a tu límite de suscriptores',
      paragraphs: [
        `${siteName} tiene ${activeCount} suscriptores confirmados y su tramo es de ${bandCeiling}. Al llegar a ${bandCeiling}, las nuevas entradas dejan de enviarse hasta que subas de tramo o la lista se reduzca.`,
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
      subject: `${siteName} se acerca a su límite mensual de correos`,
      heading: 'Has usado la mayoría de los correos de este mes',
      paragraphs: [
        `${siteName} ha enviado ${sent} de sus ${allowance} correos este mes. Una entrada solo sale si cabe entera, y el cupo se renueva el ${resetDate}.`,
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
        `${siteName} ha superado su tramo de ${bandCeiling} suscriptores, así que “${postTitle}” se publicó pero no se envió. Cuando vuelvas a estar dentro de tu tramo, podrás enviarla con Send emails en la entrada, en el Studio. Las entradas se siguen publicando y los lectores se pueden seguir suscribiendo.`,
      ],
      closingLine: moveUp
        ? `Pasa al tramo de ${moveUp.ceiling} (${moveUp.extra}) y tu próxima entrada se enviará, o vuelve a bajar la lista de ${bandCeiling}.`
        : `Vuelve a bajar la lista de ${bandCeiling} y tu próxima entrada se enviará.`,
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
        `${siteName} ha usado los ${allowance} correos de este mes, así que “${postTitle}” se publicó pero no se envió. Los envíos vuelven a empezar el ${resetDate}; cuando el cupo la cubra, podrás enviar la entrada con Send emails en el Studio.`,
      ],
      closingLine:
        moveUp &&
        `Pasa al tramo de ${moveUp.ceiling} (${moveUp.extra}) y tu próxima entrada se enviará, o espera al ${resetDate}.`,
    }),
  },
};
