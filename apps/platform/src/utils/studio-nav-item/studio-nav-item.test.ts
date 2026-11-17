import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { STUDIO_ACCESS } from '@shinefold/config/constants';

import { studioNavItem } from './studio-nav-item';

const t = makeEnTranslator('navSections');

const studioHref = adminRoutes.dashboardStudio();

const PENDING_ACCESSES = [
  STUDIO_ACCESS.INVITE_SENT,
  STUDIO_ACCESS.ACTIVATING,
  STUDIO_ACCESS.STALLED,
];

describe(studioNavItem, () => {
  it('links to the given Studio route', () => {
    const { href } = studioNavItem(t, studioHref);

    expect(href).toBe(studioHref);
  });

  it.each(PENDING_ACCESSES)('carries the %s access line', (access) => {
    const { status } = studioNavItem(t, studioHref, access);

    expect(status?.text).toBe(t(`studioAccessLine.${access}`));
  });

  it('gives each pending access state an icon of its own', () => {
    const icons = PENDING_ACCESSES.map(
      (access) => studioNavItem(t, studioHref, access).status?.icon,
    );

    expect(new Set(icons).size).toBe(PENDING_ACCESSES.length);
  });

  it.each([STUDIO_ACCESS.READY, undefined])(
    'carries no line when the access is %s',
    (access) => {
      const { status } = studioNavItem(t, studioHref, access);

      expect(status).toBeUndefined();
    },
  );

  it.each(Object.values(STUDIO_ACCESS))(
    'never badges the %s state',
    (access) => {
      const { badge } = studioNavItem(t, studioHref, access);

      expect(badge).toBeUndefined();
    },
  );
});
