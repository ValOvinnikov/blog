import { ERROR_CODE } from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_DEPROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_RUN_AT,
  MOCK_STEP_ERROR,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { updateDeprovisioningStep } from './update-deprovisioning-step';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const { REMOVE_DOMAIN, ARCHIVE_SANITY_PROJECT } = DEPROVISIONING_STEP;
const { RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(updateDeprovisioningStep, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      deprovisioningSteps: MOCK_IDLE_DEPROVISIONING_STEPS,
    }));
  });

  it('updates only the given step, leaving every other step untouched', async () => {
    const { deprovisioningSteps } = unwrapOk(
      await updateDeprovisioningStep({
        tenantId,
        step: REMOVE_DOMAIN,
        status: RUNNING,
      }),
    );

    expect(deprovisioningSteps).toEqual({
      ...MOCK_IDLE_DEPROVISIONING_STEPS,
      [REMOVE_DOMAIN]: { status: RUNNING, updatedAt: MOCK_RUN_AT },
    });
  });

  it('does not clobber an earlier updated step when a later one is updated', async () => {
    await updateDeprovisioningStep({
      tenantId,
      step: REMOVE_DOMAIN,
      status: DONE,
    });
    const { deprovisioningSteps } = unwrapOk(
      await updateDeprovisioningStep({
        tenantId,
        step: ARCHIVE_SANITY_PROJECT,
        status: RUNNING,
      }),
    );

    expect(deprovisioningSteps).toEqual({
      ...MOCK_IDLE_DEPROVISIONING_STEPS,
      [REMOVE_DOMAIN]: { status: DONE, updatedAt: MOCK_RUN_AT },
      [ARCHIVE_SANITY_PROJECT]: { status: RUNNING, updatedAt: MOCK_RUN_AT },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const { deprovisioningSteps } = unwrapOk(
      await updateDeprovisioningStep({
        tenantId,
        step: ARCHIVE_SANITY_PROJECT,
        status: FAILED,
        error: MOCK_STEP_ERROR,
      }),
    );

    expect(deprovisioningSteps?.[ARCHIVE_SANITY_PROJECT]).toEqual({
      status: FAILED,
      error: MOCK_STEP_ERROR,
      updatedAt: MOCK_RUN_AT,
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await updateDeprovisioningStep({
      tenantId: MOCK_MISSING_TENANT_ID,
      step: REMOVE_DOMAIN,
      status: RUNNING,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
