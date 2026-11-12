import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { NEWSLETTER_LIMIT_NOTICE_KIND } from '@blog/db/constants';
import type { TOwnerNewsletterText } from '@worker/utils/newsletter-send/owner-newsletter-copy-input';

type TOwnerNewsletterPausedCopy = {
  [NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED]: TOwnerNewsletterText;
};

const { SENDING_PAUSED } = NEWSLETTER_LIMIT_NOTICE_KIND;

export const OWNER_NEWSLETTER_PAUSED_COPY = {
  [LOCALE_ISO_CODES.EN]: {
    [SENDING_PAUSED]: ({ siteName, bandCeiling, allowance, isOverBand }) => ({
      subject: `Post emails for ${siteName} are paused`,
      paragraphs: [
        isOverBand
          ? `${siteName} has more confirmed subscribers than the ${bandCeiling} its plan includes, so new posts are not emailed.`
          : `Emailing your latest post would have gone over this month’s allowance of ${allowance} post emails, so it was not sent.`,
        'A post published while sending is paused is not emailed later, even once sending resumes.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.NL]: {
    [SENDING_PAUSED]: ({ siteName, bandCeiling, allowance, isOverBand }) => ({
      subject: `Berichtmails voor ${siteName} zijn gepauzeerd`,
      paragraphs: [
        isOverBand
          ? `${siteName} heeft meer bevestigde abonnees dan de ${bandCeiling} die het abonnement omvat, dus nieuwe berichten worden niet gemaild.`
          : `Het mailen van je laatste bericht zou boven het tegoed van ${allowance} berichtmails van deze maand uitkomen, dus het is niet verstuurd.`,
        'Een bericht dat tijdens de pauze verschijnt, wordt later niet alsnog gemaild, ook niet als het versturen weer start.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.FR]: {
    [SENDING_PAUSED]: ({ siteName, bandCeiling, allowance, isOverBand }) => ({
      subject: `Les e-mails d’articles de ${siteName} sont en pause`,
      paragraphs: [
        isOverBand
          ? `${siteName} compte plus d’abonnés confirmés que les ${bandCeiling} inclus dans son offre : les nouveaux articles ne sont donc pas envoyés.`
          : `L’envoi de votre dernier article aurait dépassé le quota de ${allowance} e-mails d’articles de ce mois : il n’a donc pas été envoyé.`,
        'Un article publié pendant la pause n’est pas envoyé plus tard, même une fois les envois repris.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.DE]: {
    [SENDING_PAUSED]: ({ siteName, bandCeiling, allowance, isOverBand }) => ({
      subject: `Beitrags-E-Mails für ${siteName} sind pausiert`,
      paragraphs: [
        isOverBand
          ? `${siteName} hat mehr bestätigte Abonnenten als die ${bandCeiling}, die der Tarif umfasst, deshalb werden neue Beiträge nicht versendet.`
          : `Der Versand Ihres neuesten Beitrags hätte das Kontingent von ${allowance} Beitrags-E-Mails dieses Monats überschritten, deshalb wurde er nicht versendet.`,
        'Ein Beitrag, der während der Pause erscheint, wird auch später nicht versendet, wenn der Versand wieder läuft.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.ES]: {
    [SENDING_PAUSED]: ({ siteName, bandCeiling, allowance, isOverBand }) => ({
      subject: `Los correos de entradas de ${siteName} están en pausa`,
      paragraphs: [
        isOverBand
          ? `${siteName} tiene más suscriptores confirmados que los ${bandCeiling} que incluye su plan, así que las nuevas entradas no se envían.`
          : `Enviar tu última entrada habría superado el cupo de ${allowance} correos de entradas de este mes, así que no se ha enviado.`,
        'Una entrada publicada durante la pausa no se envía más tarde, aunque los envíos se reanuden.',
      ],
    }),
  },
} satisfies Record<TLocaleIsoCode, TOwnerNewsletterPausedCopy>;
