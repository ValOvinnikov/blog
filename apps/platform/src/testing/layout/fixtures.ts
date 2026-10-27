import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { TNavItemBadge } from '@platform/components/features/layout/nav-item-content';
import type {
  TSidebarNavItem,
  TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';

type TNavLinkItem = Extract<TSidebarNavItem, { href: string }>;
type TNavInertItem = Exclude<TSidebarNavItem, TNavLinkItem>;

export const mockNavBadge = (
  overrides: Partial<TNavItemBadge> = {},
): TNavItemBadge => ({
  label: faker.lorem.words(2),
  tone: 'neutral',
  ...overrides,
});

export const mockNavLinkItem = (
  overrides: Partial<TNavLinkItem> = {},
): TNavLinkItem => ({
  label: faker.lorem.word(),
  icon: ICONS.GRID,
  href: `/${faker.lorem.slug()}`,
  ...overrides,
});

export const mockNavInertItem = (
  overrides: Partial<TNavInertItem> = {},
): TNavInertItem => ({
  label: faker.lorem.word(),
  icon: ICONS.GLOBE,
  ...overrides,
});

export const mockNavSection = (
  overrides: Partial<TSidebarNavSection> = {},
): TSidebarNavSection => ({
  label: faker.company.name(),
  items: [mockNavLinkItem()],
  ...overrides,
});
