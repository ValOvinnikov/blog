import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

type TOwnerEmailCopyInput = {
  siteName: string;
  siteUrl: string;
  ownerEmail: string;
};

export type TOwnerEmailText = {
  subject: string;
  previewText: string;
  paragraphs: string[];
};

type TOwnerEmailTextWithAction = TOwnerEmailText & { actionLabel: string };

type TOwnerEmailCopy = {
  inviteHeadsUp: (input: TOwnerEmailCopyInput) => TOwnerEmailText;
  inviteNudge: (input: TOwnerEmailCopyInput) => TOwnerEmailTextWithAction;
  siteReady: (input: TOwnerEmailCopyInput) => TOwnerEmailTextWithAction;
};

export const OWNER_EMAIL_COPY = {
  [LOCALE_ISO_CODES.EN]: {
    inviteHeadsUp: ({ siteName, ownerEmail }) => ({
      subject: 'Check your inbox for your Sanity invite',
      previewText: `Accept it to start editing ${siteName}.`,
      paragraphs: [
        `We’re setting up ${siteName}. Sanity, the editor behind your site, has emailed an invite to ${ownerEmail}.`,
        'Accept it and sign in with the account you want to edit with. You’ll use the same account every time.',
        'Once you’ve accepted, we’ll finish setting up your access and let you know when your site is ready.',
      ],
    }),
    inviteNudge: ({ siteName, ownerEmail }) => ({
      subject: 'Your Sanity invite is still waiting',
      previewText: `Accept it to start editing ${siteName}.`,
      paragraphs: [
        `Sanity emailed an invite to ${ownerEmail} a day ago, and it hasn’t been accepted yet.`,
        'Look for an email from Sanity, including in your spam folder, and accept it. Can’t find it? Send a new invite from your dashboard.',
      ],
      actionLabel: 'Open your dashboard',
    }),
    siteReady: ({ siteName, siteUrl }) => ({
      subject: `${siteName} is ready`,
      previewText: 'Your access is set up. Start editing.',
      paragraphs: [
        `Your access is set up, so you can start editing ${siteName} now.`,
        `Your site is live at ${siteUrl}.`,
      ],
      actionLabel: 'Open the Studio',
    }),
  },
  [LOCALE_ISO_CODES.NL]: {
    inviteHeadsUp: ({ siteName, ownerEmail }) => ({
      subject: 'Kijk in je inbox voor je Sanity-uitnodiging',
      previewText: `Accepteer hem om ${siteName} te gaan bewerken.`,
      paragraphs: [
        `We zijn ${siteName} aan het opzetten. Sanity, de editor achter je site, heeft een uitnodiging gestuurd naar ${ownerEmail}.`,
        'Accepteer hem en log in met het account waarmee je wilt bewerken. Je gebruikt elke keer hetzelfde account.',
        'Zodra je hebt geaccepteerd, richten we je toegang verder in en laten we je weten wanneer je site klaar is.',
      ],
    }),
    inviteNudge: ({ siteName, ownerEmail }) => ({
      subject: 'Je Sanity-uitnodiging wacht nog op je',
      previewText: `Accepteer hem om ${siteName} te gaan bewerken.`,
      paragraphs: [
        `Sanity heeft een dag geleden een uitnodiging gestuurd naar ${ownerEmail}, en die is nog niet geaccepteerd.`,
        'Zoek een e-mail van Sanity, ook in je spammap, en accepteer de uitnodiging. Kun je hem niet vinden? Stuur een nieuwe uitnodiging vanuit je dashboard.',
      ],
      actionLabel: 'Open je dashboard',
    }),
    siteReady: ({ siteName, siteUrl }) => ({
      subject: `${siteName} is klaar`,
      previewText: 'Je toegang is ingericht. Ga aan de slag.',
      paragraphs: [
        `Je toegang is ingericht, dus je kunt ${siteName} nu bewerken.`,
        `Je site staat live op ${siteUrl}.`,
      ],
      actionLabel: 'Open de Studio',
    }),
  },
  [LOCALE_ISO_CODES.FR]: {
    inviteHeadsUp: ({ siteName, ownerEmail }) => ({
      subject: 'Votre invitation Sanity vous attend dans votre boîte mail',
      previewText: `Acceptez-la pour commencer à modifier ${siteName}.`,
      paragraphs: [
        `Nous préparons ${siteName}. Sanity, l’éditeur de votre site, a envoyé une invitation à ${ownerEmail}.`,
        'Acceptez-la et connectez-vous avec le compte que vous utiliserez pour modifier votre site. Vous utiliserez toujours ce même compte.',
        'Une fois l’invitation acceptée, nous finalisons votre accès et vous prévenons dès que votre site est prêt.',
      ],
    }),
    inviteNudge: ({ siteName, ownerEmail }) => ({
      subject: 'Votre invitation Sanity est toujours en attente',
      previewText: `Acceptez-la pour commencer à modifier ${siteName}.`,
      paragraphs: [
        `Sanity a envoyé une invitation à ${ownerEmail} il y a un jour, et elle n’a pas encore été acceptée.`,
        'Cherchez un e-mail de Sanity, y compris dans vos spams, et acceptez l’invitation. Vous ne la trouvez pas ? Envoyez-en une nouvelle depuis votre tableau de bord.',
      ],
      actionLabel: 'Ouvrir le tableau de bord',
    }),
    siteReady: ({ siteName, siteUrl }) => ({
      subject: `${siteName} est prêt`,
      previewText: 'Votre accès est configuré. À vous de jouer.',
      paragraphs: [
        `Votre accès est configuré : vous pouvez dès maintenant modifier ${siteName}.`,
        `Votre site est en ligne à l’adresse ${siteUrl}.`,
      ],
      actionLabel: 'Ouvrir le Studio',
    }),
  },
  [LOCALE_ISO_CODES.DE]: {
    inviteHeadsUp: ({ siteName, ownerEmail }) => ({
      subject: 'Ihre Sanity-Einladung ist unterwegs',
      previewText: `Nehmen Sie sie an, um ${siteName} zu bearbeiten.`,
      paragraphs: [
        `Wir richten ${siteName} gerade ein. Sanity, der Editor hinter Ihrer Website, hat eine Einladung an ${ownerEmail} geschickt.`,
        'Nehmen Sie sie an und melden Sie sich mit dem Konto an, mit dem Sie bearbeiten möchten. Sie verwenden jedes Mal dasselbe Konto.',
        'Sobald Sie sie angenommen haben, richten wir Ihren Zugang fertig ein und geben Ihnen Bescheid, wenn Ihre Website bereit ist.',
      ],
    }),
    inviteNudge: ({ siteName, ownerEmail }) => ({
      subject: 'Ihre Sanity-Einladung wartet noch',
      previewText: `Nehmen Sie sie an, um ${siteName} zu bearbeiten.`,
      paragraphs: [
        `Sanity hat vor einem Tag eine Einladung an ${ownerEmail} geschickt, die noch nicht angenommen wurde.`,
        'Suchen Sie nach einer E-Mail von Sanity, auch im Spam-Ordner, und nehmen Sie die Einladung an. Sie finden sie nicht? Senden Sie über Ihr Dashboard eine neue Einladung.',
      ],
      actionLabel: 'Dashboard öffnen',
    }),
    siteReady: ({ siteName, siteUrl }) => ({
      subject: `${siteName} ist bereit`,
      previewText: 'Ihr Zugang ist eingerichtet. Legen Sie los.',
      paragraphs: [
        `Ihr Zugang ist eingerichtet, Sie können ${siteName} jetzt bearbeiten.`,
        `Ihre Website ist unter ${siteUrl} online.`,
      ],
      actionLabel: 'Studio öffnen',
    }),
  },
  [LOCALE_ISO_CODES.ES]: {
    inviteHeadsUp: ({ siteName, ownerEmail }) => ({
      subject: 'Revise su bandeja de entrada: tiene una invitación de Sanity',
      previewText: `Acéptela para empezar a editar ${siteName}.`,
      paragraphs: [
        `Estamos preparando ${siteName}. Sanity, el editor de su sitio, ha enviado una invitación a ${ownerEmail}.`,
        'Acéptela e inicie sesión con la cuenta con la que quiera editar. Usará siempre esa misma cuenta.',
        'En cuanto la acepte, terminaremos de configurar su acceso y le avisaremos cuando su sitio esté listo.',
      ],
    }),
    inviteNudge: ({ siteName, ownerEmail }) => ({
      subject: 'Su invitación de Sanity sigue pendiente',
      previewText: `Acéptela para empezar a editar ${siteName}.`,
      paragraphs: [
        `Sanity envió una invitación a ${ownerEmail} hace un día y todavía no se ha aceptado.`,
        'Busque un correo de Sanity, también en la carpeta de spam, y acepte la invitación. ¿No lo encuentra? Envíe una nueva invitación desde su panel.',
      ],
      actionLabel: 'Abrir el panel',
    }),
    siteReady: ({ siteName, siteUrl }) => ({
      subject: `${siteName} está listo`,
      previewText: 'Su acceso está configurado. Empiece a editar.',
      paragraphs: [
        `Su acceso está configurado, así que ya puede editar ${siteName}.`,
        `Su sitio está publicado en ${siteUrl}.`,
      ],
      actionLabel: 'Abrir el Studio',
    }),
  },
} as const satisfies Record<TLocaleIsoCode, TOwnerEmailCopy>;
