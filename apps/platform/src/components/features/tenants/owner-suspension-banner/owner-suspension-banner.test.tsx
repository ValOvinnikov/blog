import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import en from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_SUSPENSION_CASE,
  MOCK_SUSPENSION_DESCRIPTION,
  MOCK_SUSPENSION_REFERENCE,
  mockTenantSuspension,
} from '@platform/testing/tenant-suspensions/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { OwnerSuspensionBanner } from './owner-suspension-banner';

const { getOpenTenantSuspensionMock } = vi.hoisted(() => ({
  getOpenTenantSuspensionMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenantSuspensions: { getOpenTenantSuspension: getOpenTenantSuspensionMock },
  },
}));

const { ownerSuspensionBanner, suspensionCategory } = en;
const t = makeEnTranslator('ownerSuspensionBanner');

const OPERATOR_SUSPENDED = {
  id: MOCK_TENANT_ID,
  status: TENANT_STATUS.SUSPENDED,
  suspensionReason: SUSPENSION_REASON.OPERATOR,
};

const setup = customRenderAsync(OwnerSuspensionBanner, {
  tenant: OPERATOR_SUSPENDED,
});

describe(`<${OwnerSuspensionBanner.name}/>`, () => {
  beforeEach(() => {
    getOpenTenantSuspensionMock
      .mockReset()
      .mockResolvedValue(mockTenantSuspension());
  });

  describe('an operator suspension with an open case', () => {
    beforeEach(async () => {
      await setup();
    });

    it('tells the owner why the site is suspended and how to contest it', () => {
      const banner = screen.getByRole('alert');

      expect(banner).toHaveTextContent(ownerSuspensionBanner.title);
      expect(banner).toHaveTextContent(
        suspensionCategory[MOCK_SUSPENSION_CASE.category],
      );
      expect(banner).toHaveTextContent(MOCK_SUSPENSION_DESCRIPTION);
      expect(banner).toHaveTextContent(
        t('contest', { reference: MOCK_SUSPENSION_REFERENCE }),
      );
      expect(getOpenTenantSuspensionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('copies the reference', async () => {
      const user = userEvent.setup();
      const copyButton = screen.getByRole('button', {
        name: ownerSuspensionBanner.copyButton,
      });

      await user.click(copyButton);
      const clipboard = await navigator.clipboard.readText();

      expect(clipboard).toBe(MOCK_SUSPENSION_REFERENCE);
    });
  });

  it.each([
    [
      'once the suspension is lifted',
      { status: TENANT_STATUS.ACTIVE, suspensionReason: null },
    ],
    [
      'for a site paused for inactivity',
      { suspensionReason: SUSPENSION_REASON.INACTIVITY },
    ],
  ])('renders nothing and reads no case %s', async (_, tenantState) => {
    await setup({ tenant: { ...OPERATOR_SUSPENDED, ...tenantState } });

    const banner = screen.queryByRole('alert');

    expect(banner).not.toBeInTheDocument();
    expect(getOpenTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it('renders nothing when no case is open', async () => {
    getOpenTenantSuspensionMock.mockResolvedValue(undefined);

    await setup();

    const banner = screen.queryByRole('alert');

    expect(banner).not.toBeInTheDocument();
  });
});
