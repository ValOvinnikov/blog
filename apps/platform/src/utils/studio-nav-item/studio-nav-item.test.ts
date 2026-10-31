import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';

import { studioNavItem } from './studio-nav-item';

const t = makeEnTranslator('navSections');

const studioHref = adminRoutes.dashboardStudio();

describe(studioNavItem, () => {
  it('links to the given Studio route', () => {
    const { href } = studioNavItem(t, studioHref);

    expect(href).toBe(studioHref);
  });

  it('badges each owner access state with a label of its own', () => {
    const labels = Object.values(OWNER_STUDIO_ACCESS).map(
      (access) =>
        studioNavItem(t, studioHref, { access, hasEntered: false }).badge
          ?.label,
    );

    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('carries no badge without an owner access state', () => {
    const { badge } = studioNavItem(t, studioHref);

    expect(badge).toBeUndefined();
  });

  it('drops the Ready badge once the owner has entered the Studio', () => {
    const { badge } = studioNavItem(t, studioHref, {
      access: OWNER_STUDIO_ACCESS.READY,
      hasEntered: true,
    });

    expect(badge).toBeUndefined();
  });

  it.each([
    OWNER_STUDIO_ACCESS.INVITE_SENT,
    OWNER_STUDIO_ACCESS.ACTIVATING,
    OWNER_STUDIO_ACCESS.STALLED,
  ])('keeps the %s badge after a Studio entry', (access) => {
    const { badge } = studioNavItem(t, studioHref, {
      access,
      hasEntered: true,
    });

    expect(badge?.label).toBe(t(`studioAccess.${access}`));
  });
});
