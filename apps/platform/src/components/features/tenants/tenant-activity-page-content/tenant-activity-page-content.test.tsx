import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { mockAuditEvent } from '@platform/testing/audit-events/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import { TenantActivityPageContent } from './tenant-activity-page-content';

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
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    countAuditEventsForTargetMock.mockReset();
    countAuditEventsForTargetMock.mockResolvedValue(0);
  });

  it("asks for the requested page of the tenant's own activity, 25 at a time", async () => {
    countAuditEventsForTargetMock.mockResolvedValue(60);

    await setup({ page: 2 });

    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TENANT_ID,
      { limit: 25, offset: 25 },
    );
    expect(countAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TENANT_ID,
    );
  });

  it('renders the activity with the page position', async () => {
    listAuditEventsForTargetMock.mockResolvedValue([
      mockAuditEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
      mockAuditEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
    ]);
    countAuditEventsForTargetMock.mockResolvedValue(30);

    await setup();

    expect(screen.getByText('Settings updated')).toBeVisible();
    expect(screen.getByText('Tenant created')).toBeVisible();
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
  });

  it('shows no paging while all the activity fits on one page', async () => {
    listAuditEventsForTargetMock.mockResolvedValue([mockAuditEvent()]);
    countAuditEventsForTargetMock.mockResolvedValue(1);

    await setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('sends a page past the end to the last page', async () => {
    countAuditEventsForTargetMock.mockResolvedValue(30);

    await expect(setup({ page: 9 })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(
      `/tenants/${MOCK_TENANT_ID}/activity?page=2`,
    );
  });
});
