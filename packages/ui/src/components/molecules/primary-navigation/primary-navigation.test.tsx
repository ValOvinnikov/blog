import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';

import { PrimaryNavigation } from './primary-navigation';

faker.seed(123);

const links = faker.helpers.multiple(
  () => ({
    href: `/${faker.lorem.slug()}`,
    label: faker.lorem.words(2),
  }),
  { count: 3 },
);

const setup = customRender(PrimaryNavigation, {
  links,
});

describe(`<${PrimaryNavigation.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders all nav links', () => {
      for (const link of links) {
        expect(screen.getByRole('link', { name: link.label })).toBeVisible();
      }
    });

    it('renders as a nav landmark', () => {
      expect(screen.getByRole('navigation')).toBeVisible();
    });

    it('renders without actions when omitted', () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders no mobile panel when mobileToggle is omitted', () => {
      expect(
        screen.queryByTestId('primary-navigation-mobile-panel'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders the actions slot when provided', () => {
    setup({ actions: <button>Toggle</button> });
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  it('renders panelActions in the bar when there is no mobile toggle', () => {
    setup({ panelActions: <button type="button">Language</button> });
    expect(screen.getByRole('button', { name: 'Language' })).toBeVisible();
  });

  it('forwards target to the anchor when provided on a link', () => {
    const externalHref = faker.internet.url();
    const externalLabel = faker.lorem.words(2);

    setup({
      links: [
        ...links,
        { href: externalHref, label: externalLabel, target: '_blank' },
      ],
    });

    expect(screen.getByRole('link', { name: externalLabel })).toHaveAttribute(
      'target',
      '_blank',
    );
    for (const link of links) {
      expect(
        screen.getByRole('link', { name: link.label }),
      ).not.toHaveAttribute('target');
    }
  });

  it('renders each link via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    setup({ linkAs: CustomLink });
    expect(screen.getAllByTestId('custom-link')).toHaveLength(links.length);
  });

  describe('mobileToggle', () => {
    const ariaLabel = 'Toggle navigation menu';
    const panelId = 'primary-navigation-panel';

    it('renders the toggle button with the given ariaLabel', () => {
      setup({
        mobileToggle: {
          isOpen: false,
          onToggle: () => {},
          ariaLabel,
          panelId,
        },
      });

      expect(screen.getByRole('button', { name: ariaLabel })).toBeVisible();
    });

    it('reflects isOpen as aria-expanded and links the toggle to the panel via aria-controls/id', () => {
      setup({
        mobileToggle: {
          isOpen: true,
          onToggle: () => {},
          ariaLabel,
          panelId,
        },
      });

      const toggle = screen.getByRole('button', { name: ariaLabel });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-controls', panelId);
      expect(
        screen.getByTestId('primary-navigation-mobile-panel'),
      ).toHaveAttribute('id', panelId);
    });

    it('hides the panel when isOpen is false and shows it when isOpen is true', () => {
      const { rerender } = setup({
        mobileToggle: {
          isOpen: false,
          onToggle: () => {},
          ariaLabel,
          panelId,
        },
      });

      expect(
        screen.getByTestId('primary-navigation-mobile-panel'),
      ).not.toBeVisible();

      rerender(
        <PrimaryNavigation
          links={links}
          mobileToggle={{
            isOpen: true,
            onToggle: () => {},
            ariaLabel,
            panelId,
          }}
        />,
      );

      const panel = screen.getByTestId('primary-navigation-mobile-panel');
      expect(panel).toBeVisible();
      for (const link of links) {
        expect(
          within(panel).getByRole('link', { name: link.label }),
        ).toBeVisible();
      }
    });

    it('shows panelActions as a row in the open panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: { isOpen: true, onToggle: () => {}, ariaLabel, panelId },
      });

      expect(
        within(
          screen.getByTestId('primary-navigation-panel-actions'),
        ).getByRole('button', { name: 'Language' }),
      ).toBeVisible();
    });

    it('leaves panelActions out of the closed panel', () => {
      setup({
        panelActions: <button type="button">Language</button>,
        mobileToggle: { isOpen: false, onToggle: () => {}, ariaLabel, panelId },
      });

      expect(
        screen.queryByTestId('primary-navigation-panel-actions'),
      ).not.toBeInTheDocument();
    });

    it('calls onToggle when the toggle button is clicked', async () => {
      const onToggle = vi.fn();
      setup({
        mobileToggle: { isOpen: false, onToggle, ariaLabel, panelId },
      });

      await userEvent.click(screen.getByRole('button', { name: ariaLabel }));
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });
});
