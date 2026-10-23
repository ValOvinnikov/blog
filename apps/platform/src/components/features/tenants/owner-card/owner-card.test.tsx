import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  INVITED_PENDING_TEXT,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_OWNER_JOINED_AT,
} from '@platform/testing/tenants/fixtures';

import { OwnerCard } from './owner-card';

const render = renderWithIntl;

describe(`<${OwnerCard.name}/>`, () => {
  describe('with a resolved owner', () => {
    beforeEach(() => {
      render(
        <OwnerCard
          owner={{
            email: MOCK_OWNER_EMAIL,
            joinedAt: MOCK_OWNER_JOINED_AT,
          }}
        />,
      );
    });

    it("nests the card's title one level under the page's own h1", () => {
      const heading = screen.getByRole('heading', { level: 2, name: 'Owner' });

      expect(heading).toBeVisible();
    });

    it('shows the owner role with its translated label', () => {
      const roleLabel = screen.getByText('Role');
      const roleValue = screen.getByText('Owner', { selector: 'span' });

      expect(roleLabel).toBeVisible();
      expect(roleValue).toBeVisible();
    });

    it('shows the Joined row with the formatted date once the owner has a real membership', () => {
      const joinedLabel = screen.getByText('Joined');
      const joinedTime = screen.getByText('Aug 12, 2026');

      expect(joinedLabel).toBeVisible();
      expect(joinedTime).toBeVisible();
      expect(joinedTime.tagName).toBe('TIME');
      expect(joinedTime).toHaveAttribute(
        'dateTime',
        MOCK_OWNER_JOINED_AT.toISOString(),
      );
    });
  });

  it('shows the invited email without a Joined row while the owner is a pending invite', () => {
    render(<OwnerCard owner={{ email: MOCK_INVITED_OWNER_EMAIL }} />);

    const invitedEmail = screen.getByText(MOCK_INVITED_OWNER_EMAIL);
    const pendingBadge = screen.queryByText(INVITED_PENDING_TEXT);
    const joinedLabel = screen.queryByText('Joined');

    expect(invitedEmail).toBeVisible();
    expect(pendingBadge).not.toBeInTheDocument();
    expect(joinedLabel).not.toBeInTheDocument();
  });

  it('shows the invited-pending badge when the tenant has no owner', () => {
    render(<OwnerCard owner={undefined} />);

    const pendingBadge = screen.getByText(INVITED_PENDING_TEXT);
    const joinedLabel = screen.queryByText('Joined');

    expect(pendingBadge).toBeVisible();
    expect(joinedLabel).not.toBeInTheDocument();
  });
});
