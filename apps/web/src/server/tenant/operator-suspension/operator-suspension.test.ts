import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import { mockTenant } from '@web/testing/shared/tenant/fixtures';

import { isOperatorSuspended } from './operator-suspension';

describe(isOperatorSuspended, () => {
  it('holds for a tenant an operator suspended', () => {
    const tenant = mockTenant({
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    });

    expect(isOperatorSuspended(tenant)).toBe(true);
  });

  it.each([
    {
      case: 'a tenant suspended for inactivity',
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    },
    {
      case: 'an active tenant',
      status: TENANT_STATUS.ACTIVE,
      suspensionReason: null,
    },
    {
      case: 'an active tenant still carrying an operator reason',
      status: TENANT_STATUS.ACTIVE,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    },
  ])('does not hold for $case', ({ status, suspensionReason }) => {
    expect(isOperatorSuspended(mockTenant({ status, suspensionReason }))).toBe(
      false,
    );
  });
});
