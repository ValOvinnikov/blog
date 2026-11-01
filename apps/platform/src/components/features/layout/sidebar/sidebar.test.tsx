import { faker } from '@faker-js/faker';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import {
  mockNavBadge,
  mockNavInertItem,
  mockNavLinkItem,
  mockNavSection,
} from '@platform/testing/layout/fixtures';

import { Sidebar, type TSidebarProps } from './sidebar';

vi.mock('@platform/i18n/navigation');

faker.seed(5993);

const MOCK_LOOK_ITEM = mockNavLinkItem();
const MOCK_VOICE_ITEM = mockNavLinkItem();
const MOCK_SECTION = mockNavSection({ items: [MOCK_LOOK_ITEM] });
const MOCK_BADGE = mockNavBadge();
const MOCK_NOTE = faker.lorem.sentence();
const MOCK_SWITCHER_TEXT = faker.lorem.words(2);
const MOCK_DISABLED_REASON = faker.lorem.sentence();
const MOCK_INERT_ITEM = mockNavInertItem({
  badge: MOCK_BADGE,
  disabledReason: MOCK_DISABLED_REASON,
});

const ARIA_CURRENT = 'aria-current';

const renderSidebar = (
  props: Partial<TSidebarProps> = {},
  isInitiallyCollapsed = false,
) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <Sidebar sections={[]} {...props} />
    </SidebarCollapseProvider>,
  );

describe(`<${Sidebar.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset();
  });

  it("lists each section's label and its nav links", () => {
    renderSidebar({ sections: [MOCK_SECTION] });

    const sectionLabel = screen.getByText(MOCK_SECTION.label);
    const link = screen.getByRole('link', { name: MOCK_LOOK_ITEM.label });

    expect(sectionLabel).toBeVisible();
    expect(link).toHaveAttribute('href', MOCK_LOOK_ITEM.href);
  });

  it('renders the note and no links when a section has no items yet', () => {
    renderSidebar({
      sections: [mockNavSection({ items: [], note: MOCK_NOTE })],
    });

    const note = screen.getByText(MOCK_NOTE);
    const link = screen.queryByRole('link');

    expect(note).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it("carries a section label's full text for the hover hint", () => {
    renderSidebar({ sections: [MOCK_SECTION] });

    const sectionLabel = screen.getByText(MOCK_SECTION.label);

    expect(sectionLabel).toHaveAttribute('title', MOCK_SECTION.label);
  });

  it('renders the switcher slot when provided', () => {
    renderSidebar({ switcher: <div>{MOCK_SWITCHER_TEXT}</div> });

    const switcher = screen.getByText(MOCK_SWITCHER_TEXT);

    expect(switcher).toBeVisible();
  });

  it('renders the brand name and tagline', () => {
    renderSidebar();

    const brandName = screen.getByText(messages.sidebar.brandName);
    const brandTagline = screen.getByText(messages.sidebar.brandTagline);

    expect(brandName).toBeVisible();
    expect(brandTagline).toBeVisible();
  });

  it('renders the collapse toggle', () => {
    renderSidebar();

    const toggle = screen.getByRole('button', {
      name: messages.sidebar.collapseToggle,
    });

    expect(toggle).toBeVisible();
  });

  it("carries a link item's badge as visible text inside the link", () => {
    const item = mockNavLinkItem({ badge: MOCK_BADGE });
    renderSidebar({ sections: [mockNavSection({ items: [item] })] });

    const link = screen.getByRole('link', {
      name: `${item.label}${MOCK_BADGE.label}`,
    });
    const badge = within(link).getByText(MOCK_BADGE.label);

    expect(badge).toBeVisible();
  });

  it.each([
    { active: MOCK_LOOK_ITEM, inactive: MOCK_VOICE_ITEM },
    { active: MOCK_VOICE_ITEM, inactive: MOCK_LOOK_ITEM },
  ])(
    'marks only the item matching the current pathname active',
    ({ active, inactive }) => {
      vi.mocked(usePathname).mockReturnValue(active.href);
      renderSidebar({
        sections: [
          mockNavSection({ items: [MOCK_LOOK_ITEM, MOCK_VOICE_ITEM] }),
        ],
      });

      const activeLink = screen.getByRole('link', { name: active.label });
      const inactiveLink = screen.getByRole('link', { name: inactive.label });

      expect(activeLink).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(inactiveLink).not.toHaveAttribute(ARIA_CURRENT);
    },
  );

  it('renders an item with no href as an inert row with its reason and badge', () => {
    renderSidebar({
      sections: [mockNavSection({ items: [MOCK_INERT_ITEM] })],
    });

    const row = screen.getByRole('link', {
      name: new RegExp(MOCK_INERT_ITEM.label),
    });
    const label = screen.getByText(MOCK_INERT_ITEM.label);
    const reason = screen.getByText(MOCK_DISABLED_REASON);
    const badge = screen.getByText(MOCK_BADGE.label);

    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).not.toHaveAttribute('href');
    expect(label).toBeVisible();
    expect(reason).toBeVisible();
    expect(badge).toBeVisible();
  });

  describe('when the sidebar starts collapsed', () => {
    beforeEach(() => {
      renderSidebar(
        {
          sections: [
            mockNavSection({ items: [MOCK_LOOK_ITEM, MOCK_INERT_ITEM] }),
          ],
        },
        true,
      );
    });

    it('keeps a nav link named and titled', () => {
      const link = screen.getByRole('link', { name: MOCK_LOOK_ITEM.label });

      expect(link).toHaveAttribute('href', MOCK_LOOK_ITEM.href);
      expect(link).toHaveAttribute('title', MOCK_LOOK_ITEM.label);
    });

    it('keeps an inert row labelled and its badge visible', () => {
      const label = screen.getByText(MOCK_INERT_ITEM.label);
      const badge = screen.getByText(MOCK_BADGE.label);

      expect(label).toBeVisible();
      expect(badge).toBeVisible();
    });
  });
});
