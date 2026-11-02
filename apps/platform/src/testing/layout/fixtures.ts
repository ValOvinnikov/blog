import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { TAccount } from '@platform/components/features/layout/account-menu';
import type {
  TNavItemBadge,
  TNavItemStatus,
} from '@platform/components/features/layout/nav-item-content';
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

export const mockNavStatus = (
  overrides: Partial<TNavItemStatus> = {},
): TNavItemStatus => ({
  text: faker.lorem.words(3),
  icon: ICONS.MAIL,
  tone: 'warn',
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

export const mockAccount = (overrides: Partial<TAccount> = {}): TAccount => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  roleLine: faker.lorem.words(3),
  ...overrides,
});
