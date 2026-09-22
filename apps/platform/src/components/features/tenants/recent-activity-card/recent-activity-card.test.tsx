import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { RecentActivityCard } from './recent-activity-card';

const render = renderWithIntl;

const makeEvent = (overrides: Partial<TAuditEvent> = {}): TAuditEvent => ({
  id: 'event-1',
  actorId: 'user-1',
  actorEmail: 'vo@valstack.dev',
  action: AUDIT_ACTION.CREATED,
  targetType: AUDIT_TARGET_TYPE.TENANT,
  targetId: 'tenant-1',
  details: null,
  createdAt: new Date('2026-08-24T12:00:00.000Z'),
  ...overrides,
});

describe(RecentActivityCard, () => {
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
          makeEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
          makeEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
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

    vi.useRealTimers();
  });

  it('shows an empty state when there is no recorded activity', () => {
    render(<RecentActivityCard events={[]} />);

    expect(screen.getByText('No activity recorded yet.')).toBeVisible();
  });
});
