import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';

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
    const { container } = render(
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

    const activityTimeElements = Array.from(
      container.querySelectorAll('time'),
    ).filter(
      (element) =>
        element.getAttribute('dateTime') === '2026-08-24T12:00:00.000Z',
    );
    expect(activityTimeElements).toHaveLength(2);
  });

  it('shows an empty state when there is no recorded activity', () => {
    render(<RecentActivityCard events={[]} />);

    expect(screen.getByText('No activity recorded yet.')).toBeVisible();
  });
});
