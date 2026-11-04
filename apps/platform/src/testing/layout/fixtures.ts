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
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';

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

export const mockTenantSwitcherItem = (
  overrides: Partial<TTenantSwitcherItem> = {},
): TTenantSwitcherItem => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  primaryDomain: faker.internet.domainName(),
  isArchived: false,
  ...overrides,
});

export const mockDashboardStudioInnerPath = () =>
  `${adminRoutes.dashboardStudio()}/${faker.lorem.slug()}`;
