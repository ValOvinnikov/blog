import { GRACE_EMAIL } from '@shinefold/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_ES: TOwnerGraceEmailCopy = {
  upgradeAnyTime:
    'No se ha eliminado nada. Puede mejorar su plan en cualquier momento para volver a activar sus funciones.',
  keepAsTheyAre: (date) =>
    `Mejore su plan antes del ${date} para mantenerlo todo como está.`,
  memberLock: ({ count, date }) =>
    `El ${date}, ${count} ${count === 1 ? 'miembro del equipo perderá' : 'miembros del equipo perderán'} el acceso a la administración del sitio. Sus cuentas se conservan y el acceso vuelve en cuanto mejore su plan.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `El ${date}, la dirección principal de su sitio pasará de ${customDomain} a ${subdomain}.`,
  planComparisonLabel: 'Vea lo que incluye cada plan',
  emails: {
    [GRACE_EMAIL.STARTED]: ({ siteName }) => ({
      subject: `${siteName} está ahora en el plan gratuito`,
      previewText: 'Mejore su plan para volver a activar sus funciones.',
      paragraphs: [
        `${siteName} ha pasado al plan gratuito porque su periodo de prueba o su plan de pago ha terminado.`,
      ],
    }),
    [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
      subject: `${siteName}: queda una semana para que se apliquen los límites del plan gratuito`,
      previewText: `Mejore su plan antes del ${date} para conservar su equipo y su dirección.`,
      paragraphs: [`${siteName} pasó al plan gratuito hace una semana.`],
    }),
    [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
      subject: `${siteName}: mañana se aplican los límites del plan gratuito`,
      previewText:
        'Mejore su plan hoy para conservar su equipo y su dirección.',
      paragraphs: [
        `${siteName} lleva casi dos semanas en el plan gratuito, y sus límites se aplican mañana, ${date}.`,
      ],
    }),
  },
  fewerSeats: {
    teamActionLabel: 'Abrir Equipo',
    memberLock: ({ members, date }) =>
      `El ${date}, estos miembros del equipo perderán el acceso a la administración del sitio: ${members}. Sus cuentas se conservan.`,
    closing: (date) =>
      `Para elegir quién conserva el acceso, retire miembros en la página Equipo antes del ${date}, o cambie a un plan con más plazas.`,
    emails: {
      [GRACE_EMAIL.STARTED]: ({ siteName, date }) => ({
        subject: `${siteName} tiene más miembros en el equipo que plazas en su plan`,
        previewText: `Elija quién conserva el acceso antes del ${date}.`,
        paragraphs: [
          `${siteName} ha pasado a un plan con menos plazas, y su equipo supera ahora el límite.`,
        ],
      }),
      [GRACE_EMAIL.HALFWAY]: ({ siteName, date }) => ({
        subject: `${siteName}: queda una semana para que los miembros que superan las plazas del plan pierdan el acceso`,
        previewText: `Retire miembros o cambie de plan antes del ${date}.`,
        paragraphs: [
          `${siteName} pasó a un plan con menos plazas hace una semana, y su equipo sigue superando el límite.`,
        ],
      }),
      [GRACE_EMAIL.ENDING]: ({ siteName, date }) => ({
        subject: `${siteName}: los miembros que superan las plazas del plan pierden el acceso mañana`,
        previewText: 'Elija hoy quién conserva el acceso.',
        paragraphs: [
          `El equipo de ${siteName} sigue superando las plazas de su plan, y el límite se aplica mañana, ${date}.`,
        ],
      }),
    },
  },
};
