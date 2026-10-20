import messages from '@platform/i18n/messages/en.json';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { createTranslator } from 'next-intl';

import { studioNavItem } from './studio-nav-item';

const t = createTranslator({
  locale: 'EN',
  messages,
  namespace: 'navSections',
}) as unknown as TLooseTranslator;

describe(studioNavItem, () => {
  it('links to the given Studio route', () => {
    expect(studioNavItem(t, '/dashboard/studio')).toMatchObject({
      label: 'Studio',
      href: '/dashboard/studio',
    });
  });

  it.each([
    ['INVITE_SENT', 'Invite sent'],
    ['ACTIVATING', 'Activating'],
    ['READY', 'Ready'],
    ['STALLED', 'Action needed'],
  ] as const)("badges the link with the owner's %s access", (access, label) => {
    const { badge } = studioNavItem(t, '/dashboard/studio', access);

    expect(badge?.label).toBe(label);
  });

  it('carries no badge without an owner access state', () => {
    expect(studioNavItem(t, '/dashboard/studio').badge).toBeUndefined();
  });
});
