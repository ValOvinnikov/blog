import {
  AUDIT_ACTION,
  GITHUB_AUDIT_ACTOR_ID_PREFIX,
  WORKER_AUDIT_ACTOR_ID,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { TENANT_DETAILS_FIELD } from '@platform/constants/tenant';
import {
  mockAuditEvent,
  MOCK_AUDIT_ACTOR_EMAIL,
  MOCK_AUDIT_EVENT_AT,
} from '@platform/testing/audit-events/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';

import { ActivityList } from './activity-list';

faker.seed(5783);

const MOCK_SECOND_EVENT_ID = faker.string.uuid();
const MOCK_GITHUB_HANDLE = faker.internet.username();
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const MOCK_NOW = new Date(MOCK_AUDIT_EVENT_AT.getTime() + FIVE_MINUTES_MS);
const MOCK_FROM_DOMAIN = faker.internet.domainName();
const MOCK_TO_DOMAIN = faker.internet.domainName();

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
      vi.setSystemTime(MOCK_NOW);
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

  it('names a deleted account when the actor has no account any more', () => {
    setup({ events: [mockAuditEvent({ actorAccountEmail: null })] });

    const deletedAccountLabel = screen.getByText('Deleted account');

    expect(deletedAccountLabel).toBeVisible();
  });

  it('names the worker as the system', () => {
    setup({
      events: [
        mockAuditEvent({
          actorId: WORKER_AUDIT_ACTOR_ID,
          actorAccountEmail: null,
        }),
      ],
    });

    const systemLabel = screen.getByText('System');

    expect(systemLabel).toBeVisible();
  });

  it('names a GitHub workflow actor by their handle', () => {
    setup({
      events: [
        mockAuditEvent({
          actorId: `${GITHUB_AUDIT_ACTOR_ID_PREFIX}${MOCK_GITHUB_HANDLE}`,
          actorAccountEmail: null,
        }),
      ],
    });

    const handleLabel = screen.getByText(MOCK_GITHUB_HANDLE);

    expect(handleLabel).toBeVisible();
  });

  it('says which tenant details a save changed and that the Studio invite went unsent', () => {
    setup({
      events: [
        mockAuditEvent({
          action: AUDIT_ACTION.SETTINGS_UPDATED,
          details: {
            changedFields: [
              TENANT_DETAILS_FIELD.NAME,
              TENANT_DETAILS_FIELD.OWNER_EMAIL,
            ],
            studioReinviteRequested: false,
            studioReinviteUnsent: true,
          },
        }),
      ],
    });

    const changedFields = screen.getByText('Changed: Name and Owner email');
    const unsentInvite = screen.getByText("New owner's Studio invite not sent");

    expect(changedFields).toBeVisible();
    expect(unsentInvite).toBeVisible();
  });

  it('shows the previous and new main address of an address switch', () => {
    setup({
      events: [
        mockAuditEvent({
          action: AUDIT_ACTION.SETTINGS_UPDATED,
          details: {
            mainAddressChanged: { from: MOCK_FROM_DOMAIN, to: MOCK_TO_DOMAIN },
          },
        }),
      ],
    });

    const mainAddress = screen.getByText(
      `Main address: ${MOCK_FROM_DOMAIN} → ${MOCK_TO_DOMAIN}`,
    );

    expect(mainAddress).toBeVisible();
  });

  it('shows no raw detail keys it does not know', () => {
    const unknownKey = faker.lorem.word();
    setup({
      events: [
        mockAuditEvent({
          action: AUDIT_ACTION.SETTINGS_UPDATED,
          details: { [unknownKey]: MOCK_TO_DOMAIN },
        }),
      ],
    });

    const rawValue = screen.queryByText(MOCK_TO_DOMAIN, { exact: false });

    expect(rawValue).not.toBeInTheDocument();
  });

  it('shows an empty state when there is no recorded activity', () => {
    setup({ events: [] });

    const emptyState = screen.getByText('No activity recorded yet.');

    expect(emptyState).toBeVisible();
  });
});
