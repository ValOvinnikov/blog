import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { AUDIT_EVENTS_PAGE_SIZE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { mockAuditEvent } from '@platform/testing/audit-events/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import { TenantActivityPageContent } from './tenant-activity-page-content';

faker.seed(5783);

const MOCK_SECOND_EVENT_ID = faker.string.uuid();

const { listAuditEventsForTargetMock, countAuditEventsForTargetMock } =
  vi.hoisted(() => ({
    listAuditEventsForTargetMock: vi.fn(),
    countAuditEventsForTargetMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: {
    auditEvents: {
      listAuditEventsForTarget: listAuditEventsForTargetMock,
      countAuditEventsForTarget: countAuditEventsForTargetMock,
    },
  },
}));

const setup = customRenderAsync(TenantActivityPageContent, {
  tenant: mockReadyTenant({ id: MOCK_TENANT_ID }),
  page: 1,
});

describe(TenantActivityPageContent, () => {
  beforeEach(() => {
    listAuditEventsForTargetMock.mockResolvedValue([
      mockAuditEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
      mockAuditEvent({
        id: MOCK_SECOND_EVENT_ID,
        action: AUDIT_ACTION.CREATED,
      }),
    ]);
  });

  describe('with more than one page of activity', () => {
    beforeEach(() => {
      countAuditEventsForTargetMock.mockResolvedValue(
        AUDIT_EVENTS_PAGE_SIZE + 1,
      );
    });

    it("asks for the requested page of the tenant's own activity", async () => {
      await setup({ page: 2 });

      expect(countAuditEventsForTargetMock).toHaveBeenCalledWith(
        AUDIT_TARGET_TYPE.TENANT,
        MOCK_TENANT_ID,
      );
      expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
        AUDIT_TARGET_TYPE.TENANT,
        MOCK_TENANT_ID,
        { limit: AUDIT_EVENTS_PAGE_SIZE, offset: AUDIT_EVENTS_PAGE_SIZE },
      );
    });

    it('renders the activity with the page position', async () => {
      await setup();

      const settingsUpdatedLabel = screen.getByText('Settings updated');
      const createdLabel = screen.getByText('Tenant created');
      const pagePosition = screen.getByText('Page 1 of 2');

      expect(settingsUpdatedLabel).toBeVisible();
      expect(createdLabel).toBeVisible();
      expect(pagePosition).toBeVisible();
    });

    it('sends a page past the end to the last page without reading its rows', async () => {
      await expect(setup({ page: 9 })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(
        `/tenants/${MOCK_TENANT_ID}/activity?page=2`,
      );
      expect(listAuditEventsForTargetMock).not.toHaveBeenCalled();
    });
  });

  describe('with one page of activity', () => {
    beforeEach(async () => {
      countAuditEventsForTargetMock.mockResolvedValue(1);
      await setup();
    });

    it('shows no paging', () => {
      const navigation = screen.queryByRole('navigation');

      expect(navigation).not.toBeInTheDocument();
    });
  });
});
