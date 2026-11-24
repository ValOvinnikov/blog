import { itGatesToSuperAdmins } from '@platform/testing/admins/super-admin-layout-gate';

import DataRequestsLayout from './layout';

vi.mock('@platform/server/auth/auth');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/admins/super-admin-gate-db')
  ).mockSuperAdminGateDb(),
);

describe(`<${DataRequestsLayout.name}/>`, () => {
  itGatesToSuperAdmins(DataRequestsLayout);
});
