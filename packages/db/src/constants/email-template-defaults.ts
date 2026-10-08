import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';

export type TEmailTemplateDefaultCopy = {
  subject: string;
  body: TEmailTemplateBlock[];
};

type TEmailTemplateDefaultCopySet = Record<
  TEmailTemplateType,
  TEmailTemplateDefaultCopy
>;

function paragraph(key: string, text: string): TEmailTemplateBlock {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-span`, text, marks: [] }],
  };
}

function copySet(
  copy: Record<TEmailTemplateType, [subject: string, ...paragraphs: string[]]>,
): TEmailTemplateDefaultCopySet {
  return Object.fromEntries(
    Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => {
      const [subject, ...paragraphs] = copy[templateType];
      const keyPrefix = templateType.toLowerCase().replaceAll('_', '-');

      return [
        templateType,
        {
          subject,
          body: paragraphs.map((text, index) =>
            paragraph(`${keyPrefix}-default-${index + 1}`, text),
          ),
        },
      ];
    }),
  ) as TEmailTemplateDefaultCopySet;
}

// Deliberately generic: no tenant name, host or link — the actionable element
// (sign-in button, invite-accept button, unsubscribe link) is rendered by
// `@blog/email`'s templates, never inside this authored copy.
export const EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE: Record<
  TLocaleIsoCode,
  TEmailTemplateDefaultCopySet
> = {
  [LOCALE_ISO_CODES.EN]: copySet({
    [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: [
      'Sign in to your account',
      'We received a request to sign in to your account. Use the button below to continue.',
      'If you did not request this email, you can safely ignore it.',
    ],
    [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: [
      "You've been invited to join the team",
      "You've been invited to join as a team member. Use the button below to accept your invitation.",
      "If you weren't expecting this invitation, you can safely ignore this email.",
    ],
    [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: [
      'Confirm your newsletter subscription',
      'Thanks for subscribing! Please confirm your email address to start receiving updates.',
      'If you did not request this, you can safely ignore this email.',
    ],
  }),
  [LOCALE_ISO_CODES.NL]: copySet({
    [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: [
      'Log in op je account',
      'We hebben een verzoek ontvangen om in te loggen op je account. Gebruik de knop hieronder om verder te gaan.',
      'Heb je deze e-mail niet aangevraagd? Dan kun je hem gewoon negeren.',
    ],
    [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: [
      'Je bent uitgenodigd om lid te worden van het team',
      'Je bent uitgenodigd om lid te worden van het team. Gebruik de knop hieronder om je uitnodiging te accepteren.',
      'Had je deze uitnodiging niet verwacht? Dan kun je deze e-mail gewoon negeren.',
    ],
    [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: [
      'Bevestig je aanmelding voor de nieuwsbrief',
      'Bedankt voor je aanmelding! Bevestig je e-mailadres om updates te ontvangen.',
      'Heb je dit niet aangevraagd? Dan kun je deze e-mail gewoon negeren.',
    ],
  }),
  [LOCALE_ISO_CODES.FR]: copySet({
    [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: [
      'Connectez-vous à votre compte',
      'Nous avons reçu une demande de connexion à votre compte. Utilisez le bouton ci-dessous pour continuer.',
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
    ],
    [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: [
      "Vous êtes invité à rejoindre l'équipe",
      "Vous êtes invité à rejoindre l'équipe en tant que membre. Utilisez le bouton ci-dessous pour accepter votre invitation.",
      'Si vous ne vous attendiez pas à cette invitation, vous pouvez ignorer cet e-mail.',
    ],
    [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: [
      'Confirmez votre inscription à la newsletter',
      'Merci de votre inscription ! Veuillez confirmer votre adresse e-mail pour commencer à recevoir nos actualités.',
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
    ],
  }),
  [LOCALE_ISO_CODES.DE]: copySet({
    [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: [
      'Bei deinem Konto anmelden',
      'Wir haben eine Anfrage zur Anmeldung bei deinem Konto erhalten. Klicke auf die Schaltfläche unten, um fortzufahren.',
      'Wenn du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.',
    ],
    [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: [
      'Du wurdest eingeladen, dem Team beizutreten',
      'Du wurdest eingeladen, dem Team als Mitglied beizutreten. Klicke auf die Schaltfläche unten, um die Einladung anzunehmen.',
      'Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail einfach ignorieren.',
    ],
    [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: [
      'Bestätige dein Newsletter-Abonnement',
      'Danke für dein Abonnement! Bitte bestätige deine E-Mail-Adresse, um Neuigkeiten zu erhalten.',
      'Wenn du das nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.',
    ],
  }),
  [LOCALE_ISO_CODES.ES]: copySet({
    [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: [
      'Inicia sesión en tu cuenta',
      'Hemos recibido una solicitud para iniciar sesión en tu cuenta. Usa el botón de abajo para continuar.',
      'Si no has solicitado este correo, puedes ignorarlo.',
    ],
    [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: [
      'Te han invitado a unirte al equipo',
      'Te han invitado a unirte al equipo como miembro. Usa el botón de abajo para aceptar la invitación.',
      'Si no esperabas esta invitación, puedes ignorar este correo.',
    ],
    [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: [
      'Confirma tu suscripción al boletín',
      '¡Gracias por suscribirte! Confirma tu dirección de correo electrónico para empezar a recibir novedades.',
      'Si no lo has solicitado, puedes ignorar este correo.',
    ],
  }),
};

export const EMAIL_TEMPLATE_DEFAULT_COPY =
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.EN];
