import userEvent from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';

import { SiteNavigation } from './site-navigation';

vi.mock('@web/i18n/navigation');

const links = [
  {
    label: 'Home',
    href: '/',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Blog',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'About',
    href: '/about',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
];

const getToggle = () =>
  screen.getByRole('button', { name: 'Toggle navigation menu' });

describe(`<${SiteNavigation.name}/>`, () => {
  it('marks the Home item active only on the exact root path', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('does not mark Home active on a nested route', () => {
    vi.mocked(usePathname).mockReturnValue('/blog');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks a section item active via prefix match on nested routes', () => {
    vi.mocked(usePathname).mockReturnValue('/blog/hello-world');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('does not match a path that merely shares the section prefix', () => {
    vi.mocked(usePathname).mockReturnValue('/blogging');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the actions slot', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderElement(
      <SiteNavigation links={links} actions={<button>Toggle</button>} />,
    );

    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  describe('mobile toggle', () => {
    beforeEach(() => {
      vi.mocked(usePathname).mockReturnValue('/');
    });

    it('passes a real, non-generic accessible name for the toggle', () => {
      renderElement(<SiteNavigation links={links} />);

      expect(getToggle()).toHaveAccessibleName('Toggle navigation menu');
    });

    it('opens the panel on toggle click and reflects it via aria-expanded', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();

      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes on Escape and returns focus to the toggle', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveFocus();
    });

    it('closes on an outside click', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);

      fireEvent.mouseDown(document.body);

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes automatically when the route changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      vi.mocked(usePathname).mockReturnValue('/blog');
      rerender(<SiteNavigation links={links} />);

      expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
