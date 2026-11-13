import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { NEWSLETTER_LIMIT_NOTICE_KIND } from '@blog/db/constants';
import type { TOwnerNewsletterText } from '@worker/utils/owner-email/owner-newsletter-copy-input';

type TOwnerNewsletterLimitCopy = {
  [NEWSLETTER_LIMIT_NOTICE_KIND.SUBSCRIBER_BAND_NEAR]: TOwnerNewsletterText;
  [NEWSLETTER_LIMIT_NOTICE_KIND.MONTHLY_ALLOWANCE_NEAR]: TOwnerNewsletterText;
};

const { SUBSCRIBER_BAND_NEAR, MONTHLY_ALLOWANCE_NEAR } =
  NEWSLETTER_LIMIT_NOTICE_KIND;

export const OWNER_NEWSLETTER_LIMIT_COPY = {
  [LOCALE_ISO_CODES.EN]: {
    [SUBSCRIBER_BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      nearPercent,
    }) => ({
      subject: `${siteName} is close to its subscriber limit`,
      paragraphs: [
        `${siteName} has ${activeCount} confirmed subscribers, over ${nearPercent} of the ${bandCeiling} its plan includes.`,
        `Above ${bandCeiling}, new posts are no longer emailed until the plan moves to a larger subscriber band.`,
      ],
    }),
    [MONTHLY_ALLOWANCE_NEAR]: ({ siteName, sentAfterThisPost, allowance }) => ({
      subject: `${siteName} has used most of this month’s post emails`,
      paragraphs: [
        `With its latest post, ${siteName} has sent ${sentAfterThisPost} of the ${allowance} post emails its plan allows this month.`,
        'A post that would go over the allowance is not emailed. The allowance starts again on the first of next month.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.NL]: {
    [SUBSCRIBER_BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      nearPercent,
    }) => ({
      subject: `${siteName} nadert de abonneelimiet`,
      paragraphs: [
        `${siteName} heeft ${activeCount} bevestigde abonnees, meer dan ${nearPercent} van de ${bandCeiling} die het abonnement omvat.`,
        `Boven de ${bandCeiling} worden nieuwe berichten niet meer gemaild totdat het abonnement naar een grotere abonneeschijf gaat.`,
      ],
    }),
    [MONTHLY_ALLOWANCE_NEAR]: ({ siteName, sentAfterThisPost, allowance }) => ({
      subject: `${siteName} heeft de meeste berichtmails van deze maand gebruikt`,
      paragraphs: [
        `Met het laatste bericht heeft ${siteName} ${sentAfterThisPost} van de ${allowance} berichtmails verstuurd die het abonnement deze maand toestaat.`,
        'Een bericht dat boven het tegoed uitkomt, wordt niet gemaild. Het tegoed begint opnieuw op de eerste van volgende maand.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.FR]: {
    [SUBSCRIBER_BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      nearPercent,
    }) => ({
      subject: `${siteName} approche de sa limite d’abonnés`,
      paragraphs: [
        `${siteName} compte ${activeCount} abonnés confirmés, plus de ${nearPercent} des ${bandCeiling} inclus dans son offre.`,
        `Au-delà de ${bandCeiling}, les nouveaux articles ne sont plus envoyés par e-mail tant que l’offre ne passe pas à une tranche d’abonnés supérieure.`,
      ],
    }),
    [MONTHLY_ALLOWANCE_NEAR]: ({ siteName, sentAfterThisPost, allowance }) => ({
      subject: `${siteName} a utilisé la plupart des e-mails d’articles de ce mois`,
      paragraphs: [
        `Avec son dernier article, ${siteName} a envoyé ${sentAfterThisPost} des ${allowance} e-mails d’articles que son offre permet ce mois-ci.`,
        'Un article qui dépasserait ce quota n’est pas envoyé. Le quota repart le premier du mois prochain.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.DE]: {
    [SUBSCRIBER_BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      nearPercent,
    }) => ({
      subject: `${siteName} erreicht bald sein Abonnentenlimit`,
      paragraphs: [
        `${siteName} hat ${activeCount} bestätigte Abonnenten, mehr als ${nearPercent} der ${bandCeiling}, die der Tarif umfasst.`,
        `Über ${bandCeiling} werden neue Beiträge nicht mehr per E-Mail versendet, bis der Tarif in eine größere Abonnentenstufe wechselt.`,
      ],
    }),
    [MONTHLY_ALLOWANCE_NEAR]: ({ siteName, sentAfterThisPost, allowance }) => ({
      subject: `${siteName} hat die meisten Beitrags-E-Mails dieses Monats verbraucht`,
      paragraphs: [
        `Mit dem neuesten Beitrag hat ${siteName} ${sentAfterThisPost} der ${allowance} Beitrags-E-Mails versendet, die der Tarif diesen Monat erlaubt.`,
        'Ein Beitrag, der das Kontingent überschreiten würde, wird nicht versendet. Das Kontingent beginnt am Ersten des nächsten Monats neu.',
      ],
    }),
  },
  [LOCALE_ISO_CODES.ES]: {
    [SUBSCRIBER_BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      nearPercent,
    }) => ({
      subject: `${siteName} está cerca de su límite de suscriptores`,
      paragraphs: [
        `${siteName} tiene ${activeCount} suscriptores confirmados, más del ${nearPercent} de los ${bandCeiling} que incluye su plan.`,
        `Por encima de ${bandCeiling}, las nuevas entradas dejan de enviarse por correo hasta que el plan pase a un tramo de suscriptores mayor.`,
      ],
    }),
    [MONTHLY_ALLOWANCE_NEAR]: ({ siteName, sentAfterThisPost, allowance }) => ({
      subject: `${siteName} ha usado casi todos los correos de entradas de este mes`,
      paragraphs: [
        `Con su última entrada, ${siteName} ha enviado ${sentAfterThisPost} de los ${allowance} correos de entradas que su plan permite este mes.`,
        'Una entrada que superaría el cupo no se envía. El cupo se renueva el primer día del mes siguiente.',
      ],
    }),
  },
} satisfies Record<TLocaleIsoCode, TOwnerNewsletterLimitCopy>;
