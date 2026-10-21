import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import messages from '@platform/i18n/messages/en.json';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { createTranslator } from 'next-intl';

import { studioNavItem } from './studio-nav-item';

const t = createTranslator({
  locale: 'EN',
  messages,
  namespace: 'navSections',
}) as unknown as TLooseTranslator;

const studioHref = adminRoutes.dashboardStudio();

describe(studioNavItem, () => {
  it('links to the given Studio route', () => {
    const { href } = studioNavItem(t, studioHref);

    expect(href).toBe(studioHref);
  });

  it('badges each owner access state with a label of its own', () => {
    const labels = Object.values(OWNER_STUDIO_ACCESS).map(
      (access) => studioNavItem(t, studioHref, access).badge?.label,
    );

    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('carries no badge without an owner access state', () => {
    const { badge } = studioNavItem(t, studioHref);

    expect(badge).toBeUndefined();
  });
});
