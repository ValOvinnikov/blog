import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import type {
  TPlanPage,
  TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { ICONS } from '@shinefold/config';

export type TTenantNavHrefs = {
  look: string;
  voice: string;
  features: string;
  leads?: string;
  languages: string;
  domain: string;
  signIn: string;
  email: string;
  studio: string;
};

export const configurationNavItems = (
  t: TLooseTranslator,
  hrefs: TTenantNavHrefs,
  access: TPlanPageAccess,
): TSidebarNavItem[] => {
  const comingSoon = {
    label: t('badgeComingSoon'),
    tone: BADGE_TONE.NEUTRAL,
    hasDot: false,
  } as const;
  const ifAccessible = (page: TPlanPage, item: TSidebarNavItem) =>
    access[page] ? [item] : [];

  return [
    { label: t('look'), icon: ICONS.PALETTE, href: hrefs.look },
    { label: t('voice'), icon: ICONS.QUOTE, href: hrefs.voice },
    { label: t('features'), icon: ICONS.SETTINGS, href: hrefs.features },
    ...(hrefs.leads
      ? ifAccessible('leads', {
          label: t('leads'),
          icon: ICONS.SEND,
          href: hrefs.leads,
        })
      : []),
    ...ifAccessible('languages', {
      label: t('languages'),
      icon: ICONS.BOOK,
      href: hrefs.languages,
    }),
    { label: t('domain'), icon: ICONS.GLOBE, href: hrefs.domain },
    { label: t('signIn'), icon: ICONS.USER_CHECK, href: hrefs.signIn },
    ...ifAccessible('email', {
      label: t('email'),
      icon: ICONS.MAIL,
      href: hrefs.email,
    }),
    ...ifAccessible('subscribers', {
      label: t('subscribers'),
      icon: ICONS.MENU_ROWS,
      badge: comingSoon,
    }),
  ];
};
