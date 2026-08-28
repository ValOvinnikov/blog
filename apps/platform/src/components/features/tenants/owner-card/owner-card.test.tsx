import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { OwnerCard } from './owner-card';

const render = renderWithIntl;

describe(OwnerCard, () => {
  it("nests the card's title one level under the page's own h1", () => {
    render(
      <OwnerCard
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
  });

  it('shows the invited-pending badge when the owner has no resolved email', () => {
    render(
      <OwnerCard
        ownerEmail={undefined}
        ownerJoinedAt={undefined}
        ownerJoinedAtIso={undefined}
      />,
    );

    expect(screen.getByText('Invited, pending')).toBeVisible();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });

  it('shows the Joined row with the formatted date once the owner has a real membership', () => {
    render(
      <OwnerCard
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(screen.getByText('Joined')).toBeVisible();
    const joinedTime = screen.getByText('Aug 12, 2026');
    expect(joinedTime).toBeVisible();
    expect(joinedTime.tagName).toBe('TIME');
    expect(joinedTime).toHaveAttribute('dateTime', '2026-08-12T00:00:00.000Z');
  });
});
