import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { OwnerCard } from './owner-card';

const render = renderWithIntl;

describe(OwnerCard, () => {
  describe('with a resolved owner', () => {
    beforeEach(() => {
      render(
        <OwnerCard
          owner={{
            email: 'owner@example.com',
            joinedAt: new Date('2026-08-12T00:00:00.000Z'),
          }}
        />,
      );
    });

    it("nests the card's title one level under the page's own h1", () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Owner' }),
      ).toBeVisible();
    });

    it('shows the owner role with its translated label', () => {
      expect(screen.getByText('Role')).toBeVisible();
      expect(screen.getByText('Owner', { selector: 'span' })).toBeVisible();
    });

    it('shows the Joined row with the formatted date once the owner has a real membership', () => {
      expect(screen.getByText('Joined')).toBeVisible();
      const joinedTime = screen.getByText('Aug 12, 2026');
      expect(joinedTime).toBeVisible();
      expect(joinedTime.tagName).toBe('TIME');
      expect(joinedTime).toHaveAttribute(
        'dateTime',
        '2026-08-12T00:00:00.000Z',
      );
    });
  });

  it('shows the invited email without a Joined row while the owner is a pending invite', () => {
    render(<OwnerCard owner={{ email: 'invited@example.com' }} />);

    expect(screen.getByText('invited@example.com')).toBeVisible();
    expect(screen.queryByText('Invited, pending')).not.toBeInTheDocument();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });

  it('shows the invited-pending badge when the tenant has no owner', () => {
    render(<OwnerCard owner={undefined} />);

    expect(screen.getByText('Invited, pending')).toBeVisible();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });
});
