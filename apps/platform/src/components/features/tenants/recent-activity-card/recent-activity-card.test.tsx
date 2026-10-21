import { AUDIT_ACTION } from '@blog/config';
import { makeAuditEvent } from '@platform/testing/audit-events/fixtures';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { RecentActivityCard } from './recent-activity-card';

const render = renderWithIntl;

describe(RecentActivityCard, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("nests the card's title one level under the page's own h1", () => {
    render(<RecentActivityCard events={[]} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Recent activity' }),
    ).toBeVisible();
  });

  it('renders recent activity events with actor email and a generic per-action label', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-24T12:05:00.000Z'));

    render(
      <RecentActivityCard
        events={[
          makeAuditEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
          makeAuditEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
        ]}
      />,
    );

    expect(screen.getByText('Settings updated')).toBeVisible();
    expect(screen.getByText('Tenant created')).toBeVisible();
    expect(screen.getAllByText('vo@valstack.dev')).toHaveLength(2);

    const activityTimes = screen.getAllByText('5m ago');
    expect(activityTimes).toHaveLength(2);
    for (const time of activityTimes) {
      expect(time).toHaveAttribute('dateTime', '2026-08-24T12:00:00.000Z');
    }
  });

  it("names a deleted account in place of an actor's cleared email", () => {
    render(
      <RecentActivityCard events={[makeAuditEvent({ actorEmail: null })]} />,
    );

    expect(screen.getByText('Deleted account')).toBeVisible();
  });

  it('shows an empty state when there is no recorded activity', () => {
    render(<RecentActivityCard events={[]} />);

    expect(screen.getByText('No activity recorded yet.')).toBeVisible();
  });
});
