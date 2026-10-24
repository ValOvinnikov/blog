import { AUDIT_ACTION } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  mockAuditEvent,
  MOCK_AUDIT_ACTOR_EMAIL,
  MOCK_AUDIT_EVENT_AT,
} from '@platform/testing/audit-events/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';

import { ActivityList } from './activity-list';

faker.seed(5783);

const MOCK_SECOND_EVENT_ID = faker.string.uuid();

const setup = customRender(ActivityList, {
  events: [
    mockAuditEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
    mockAuditEvent({ id: MOCK_SECOND_EVENT_ID, action: AUDIT_ACTION.CREATED }),
  ],
});

describe(`<${ActivityList.name}/>`, () => {
  describe('with recorded activity', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-08-24T12:05:00.000Z'));
      setup();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('labels each event by its action', () => {
      const settingsUpdatedLabel = screen.getByText('Settings updated');
      const createdLabel = screen.getByText('Tenant created');

      expect(settingsUpdatedLabel).toBeVisible();
      expect(createdLabel).toBeVisible();
    });

    it("names each event's actor by email", () => {
      const actorEmails = screen.getAllByText(MOCK_AUDIT_ACTOR_EMAIL);

      expect(actorEmails).toHaveLength(2);
    });

    it('dates each event relative to now, keeping the exact time', () => {
      const activityTimes = screen.getAllByText('5m ago');

      expect(activityTimes).toHaveLength(2);
      for (const time of activityTimes) {
        expect(time).toHaveAttribute(
          'dateTime',
          MOCK_AUDIT_EVENT_AT.toISOString(),
        );
      }
    });
  });

  it("names a deleted account in place of an actor's cleared email", () => {
    setup({ events: [mockAuditEvent({ actorEmail: null })] });

    const deletedAccountLabel = screen.getByText('Deleted account');

    expect(deletedAccountLabel).toBeVisible();
  });

  it('shows an empty state when there is no recorded activity', () => {
    setup({ events: [] });

    const emptyState = screen.getByText('No activity recorded yet.');

    expect(emptyState).toBeVisible();
  });
});
