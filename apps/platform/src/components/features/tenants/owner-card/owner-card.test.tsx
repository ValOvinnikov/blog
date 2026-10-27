import { customRender, screen } from '@platform/testing/custom-render';
import {
  INVITED_PENDING_TEXT,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_INVITED_AT,
  MOCK_OWNER_JOINED_AT,
  mockInvitedOwner,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';

import { OwnerCard } from './owner-card';

const setup = customRender(OwnerCard, { owner: mockJoinedOwner() });

describe(`<${OwnerCard.name}/>`, () => {
  describe('with an owner who has signed in', () => {
    beforeEach(() => {
      setup();
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

    it('shows the Joined row with the formatted date', () => {
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

  describe('with an owner who has not signed in yet', () => {
    beforeEach(() => {
      setup({ owner: mockInvitedOwner() });
    });

    it('shows the invited email without a Joined row', () => {
      const invitedEmail = screen.getByText(MOCK_INVITED_OWNER_EMAIL);
      const pendingBadge = screen.queryByText(INVITED_PENDING_TEXT);
      const joinedLabel = screen.queryByText('Joined');

      expect(invitedEmail).toBeVisible();
      expect(pendingBadge).not.toBeInTheDocument();
      expect(joinedLabel).not.toBeInTheDocument();
    });

    it('shows the invite date and that the owner has not signed in', () => {
      const invitedLabel = screen.getByText('Invited');
      const invitedTime = screen.getByText('Aug 10, 2026');
      const notSignedIn = screen.getByText(/not signed in yet/);

      expect(invitedLabel).toBeVisible();
      expect(notSignedIn).toBeVisible();
      expect(invitedTime.tagName).toBe('TIME');
      expect(invitedTime).toHaveAttribute(
        'dateTime',
        MOCK_OWNER_INVITED_AT.toISOString(),
      );
    });
  });

  it('shows the invited-pending badge when the tenant has no owner', () => {
    setup({ owner: undefined });

    const pendingBadge = screen.getByText(INVITED_PENDING_TEXT);
    const joinedLabel = screen.queryByText('Joined');

    expect(pendingBadge).toBeVisible();
    expect(joinedLabel).not.toBeInTheDocument();
  });
});
