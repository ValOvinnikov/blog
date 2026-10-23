import { ERROR_CODE } from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  WORKER_PROVISIONING_STEP,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_RUN_AT,
  MOCK_STEP_ERROR,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { updateProvisioningStep } from './update-provisioning-step';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const { SANITY_PROJECT, SEED_CONTENT, MAP_DOMAIN, OWNER_ELEVATION } =
  TENANT_PROVISIONING_STEP;
const { RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;
const { STALLED } = ELEVATE_TENANT_OWNER_OUTCOME;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(MOCK_RUN_AT));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(updateProvisioningStep, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
      provisioningSteps: MOCK_IDLE_PROVISIONING_STEPS,
    }));
  });

  it('updates only the given step, leaving every other step untouched', async () => {
    const { provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: SANITY_PROJECT,
        status: RUNNING,
      }),
    );

    expect(provisioningSteps).toEqual({
      ...MOCK_IDLE_PROVISIONING_STEPS,
      [SANITY_PROJECT]: { status: RUNNING, updatedAt: MOCK_RUN_AT },
    });
  });

  it('does not clobber an earlier updated step when a later one is updated', async () => {
    await updateProvisioningStep({
      tenantId,
      step: SANITY_PROJECT,
      status: DONE,
    });
    const { provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: SEED_CONTENT,
        status: RUNNING,
      }),
    );

    expect(provisioningSteps).toEqual({
      ...MOCK_IDLE_PROVISIONING_STEPS,
      [SANITY_PROJECT]: { status: DONE, updatedAt: MOCK_RUN_AT },
      [SEED_CONTENT]: { status: RUNNING, updatedAt: MOCK_RUN_AT },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const { provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: SANITY_PROJECT,
        status: FAILED,
        error: MOCK_STEP_ERROR,
      }),
    );

    expect(provisioningSteps?.[SANITY_PROJECT]).toEqual({
      status: FAILED,
      error: MOCK_STEP_ERROR,
      updatedAt: MOCK_RUN_AT,
    });
  });

  it('stores the detail only when one is supplied', async () => {
    const { provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: OWNER_ELEVATION,
        status: DONE,
        detail: STALLED,
      }),
    );

    expect(provisioningSteps?.[OWNER_ELEVATION]).toEqual({
      status: DONE,
      detail: STALLED,
      updatedAt: MOCK_RUN_AT,
    });
  });

  it('leaves the overall provisioningStatus untouched when not supplied', async () => {
    const { provisioningStatus } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: SANITY_PROJECT,
        status: DONE,
      }),
    );

    expect(provisioningStatus).toBe(TENANT_PROVISIONING_STATUS.PENDING);
  });

  it('updates the overall provisioningStatus when supplied on the last step', async () => {
    const { provisioningStatus, provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: MAP_DOMAIN,
        status: DONE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      }),
    );

    expect(provisioningStatus).toBe(TENANT_PROVISIONING_STATUS.READY);
    expect(provisioningSteps?.[MAP_DOMAIN]).toEqual({
      status: DONE,
      updatedAt: MOCK_RUN_AT,
    });
  });

  it('leaves lastNotifiedOwnerElevationOutcome untouched when not supplied', async () => {
    const { lastNotifiedOwnerElevationOutcome } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: OWNER_ELEVATION,
        status: DONE,
        detail: STALLED,
      }),
    );

    expect(lastNotifiedOwnerElevationOutcome).toBeNull();
  });

  it('records the notified owner-elevation outcome alongside the step detail', async () => {
    const { lastNotifiedOwnerElevationOutcome, provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: OWNER_ELEVATION,
        status: DONE,
        detail: STALLED,
        notifiedOwnerElevationOutcome: STALLED,
      }),
    );

    expect(lastNotifiedOwnerElevationOutcome).toBe(STALLED);
    expect(provisioningSteps?.[OWNER_ELEVATION]).toEqual({
      status: DONE,
      detail: STALLED,
      updatedAt: MOCK_RUN_AT,
    });
  });

  it('adds a worker unit step alongside the existing steps', async () => {
    const { provisioningSteps } = unwrapOk(
      await updateProvisioningStep({
        tenantId,
        step: WORKER_PROVISIONING_STEP.ENSURE_INFRASTRUCTURE,
        status: DONE,
      }),
    );

    expect(provisioningSteps).toEqual({
      ...MOCK_IDLE_PROVISIONING_STEPS,
      [WORKER_PROVISIONING_STEP.ENSURE_INFRASTRUCTURE]: {
        status: DONE,
        updatedAt: MOCK_RUN_AT,
      },
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await updateProvisioningStep({
      tenantId: MOCK_MISSING_TENANT_ID,
      step: SANITY_PROJECT,
      status: RUNNING,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
