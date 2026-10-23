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
        MOCK_OWNER_JOINED_AT.toISOString(),
      );
    });
  });

  it('shows the invited email without a Joined row while the owner is a pending invite', () => {
    render(<OwnerCard owner={{ email: MOCK_INVITED_OWNER_EMAIL }} />);

    expect(screen.getByText(MOCK_INVITED_OWNER_EMAIL)).toBeVisible();
    expect(screen.queryByText(INVITED_PENDING_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });

  it('shows the invited-pending badge when the tenant has no owner', () => {
    render(<OwnerCard owner={undefined} />);

    expect(screen.getByText(INVITED_PENDING_TEXT)).toBeVisible();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });
});
