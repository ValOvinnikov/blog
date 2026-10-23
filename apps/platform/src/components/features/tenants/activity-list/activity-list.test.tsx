import { AUDIT_ACTION } from '@blog/config';
import {
  mockAuditEvent,
  MOCK_AUDIT_ACTOR_EMAIL,
  MOCK_AUDIT_EVENT_AT,
} from '@platform/testing/audit-events/fixtures';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { ActivityList } from './activity-list';

const render = renderWithIntl;

describe(`<${ActivityList.name}/>`, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders activity events with actor email and a generic per-action label', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-24T12:05:00.000Z'));

    render(
      <ActivityList
        events={[
          mockAuditEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
          mockAuditEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
        ]}
      />,
    );

    const settingsUpdatedLabel = screen.getByText('Settings updated');
    const createdLabel = screen.getByText('Tenant created');
    const actorEmails = screen.getAllByText(MOCK_AUDIT_ACTOR_EMAIL);
    const activityTimes = screen.getAllByText('5m ago');

    expect(settingsUpdatedLabel).toBeVisible();
    expect(createdLabel).toBeVisible();
    expect(actorEmails).toHaveLength(2);
    expect(activityTimes).toHaveLength(2);
    for (const time of activityTimes) {
      expect(time).toHaveAttribute(
        'dateTime',
        MOCK_AUDIT_EVENT_AT.toISOString(),
      );
    }
  });

  it("names a deleted account in place of an actor's cleared email", () => {
    render(<ActivityList events={[mockAuditEvent({ actorEmail: null })]} />);

    const deletedAccountLabel = screen.getByText('Deleted account');

    expect(deletedAccountLabel).toBeVisible();
  });

  it('shows an empty state when there is no recorded activity', () => {
    render(<ActivityList events={[]} />);

    const emptyState = screen.getByText('No activity recorded yet.');

    expect(emptyState).toBeVisible();
  });
});
