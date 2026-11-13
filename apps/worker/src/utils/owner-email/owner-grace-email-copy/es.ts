import { GRACE_EMAIL, TENANT_PLAN } from '@blog/db/constants';
import type { TOwnerGraceEmailCopy } from '@worker/utils/owner-email/owner-email-copy-types';

export const OWNER_GRACE_EMAIL_COPY_ES: TOwnerGraceEmailCopy = {
  upgradeAnyTime:
    'Puede mejorar su plan en cualquier momento para volver a activarlas.',
  keepAsTheyAre: (date) =>
    `Mejore su plan antes del ${date} para mantenerlo todo como está.`,
  memberLock: ({ count, date }) =>
    `El ${date}, ${count} ${count === 1 ? 'miembro del equipo perderá' : 'miembros del equipo perderán'} el acceso a la administración del sitio. Sus cuentas se conservan y el acceso vuelve en cuanto mejore su plan.`,
  domainLock: ({ customDomain, subdomain, date }) =>
    `El ${date}, la dirección principal de su sitio pasará de ${customDomain} a ${subdomain}.`,
  stopped: {
    [TENANT_PLAN.GROWTH]:
      'Las secciones Growth, el boletín, las cuentas de lectores y los ajustes de Look adicionales se han desactivado. No se ha eliminado nada: todo vuelve en cuanto mejore su plan.',
    [TENANT_PLAN.STARTER]:
      'El formulario de contacto y su propia herramienta de analítica se han desactivado, y la mención «Powered by» vuelve al pie de página. No se ha eliminado nada: todo vuelve en cuanto mejore su plan.',
  },
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
};
