import { faker } from '@faker-js/faker';
import { alertSelfServeLimit } from '@platform/server/create-site-gate/alert-self-serve-limit';

import {
  MAX_SELF_SERVE_SITES_PER_DAY,
  MAX_SITES_PER_IP_PER_DAY,
  takeCreateSiteSlot,
} from './create-site-gate';

faker.seed(5998);

vi.mock('@platform/utils/env/env');
vi.mock('@platform/server/create-site-gate/alert-self-serve-limit', () => ({
  alertSelfServeLimit: vi.fn(),
}));

const DAY_MS = 24 * 60 * 60_000;
const MOCK_REFERENCE_DATE = new Date('2026-10-21T09:00:00Z');
const MOCK_FIRST_DAY = faker.date.past({ refDate: MOCK_REFERENCE_DATE });
const MOCK_CLIENT_KEY = faker.internet.ipv4();

const dayAt = (offset: number): Date =>
  new Date(MOCK_FIRST_DAY.getTime() + offset * DAY_MS);

const takeSlots = async (
  times: number,
  clientKeyAt: (index: number) => string,
  now: Date,
): Promise<boolean[]> => {
  const results: boolean[] = [];
  for (let index = 0; index < times; index += 1) {
    results.push(await takeCreateSiteSlot(clientKeyAt(index), now));
  }
  return results;
};

const sameClient = () => MOCK_CLIENT_KEY;
const distinctClient = (index: number) => `${MOCK_CLIENT_KEY}-${index}`;

describe(takeCreateSiteSlot, () => {
  it('allows creates within the per-IP limit', async () => {
    const results = await takeSlots(
      MAX_SITES_PER_IP_PER_DAY,
      sameClient,
      dayAt(0),
    );

    expect(results.every(Boolean)).toBe(true);
  });

  it('refuses the create past the per-IP limit for that day', async () => {
    const now = dayAt(1);
    await takeSlots(MAX_SITES_PER_IP_PER_DAY, sameClient, now);

    expect(await takeCreateSiteSlot(sameClient(), now)).toBe(false);
  });

  it('allows the same IP again the next day', async () => {
    await takeSlots(MAX_SITES_PER_IP_PER_DAY + 1, sameClient, dayAt(2));

    expect(await takeCreateSiteSlot(sameClient(), dayAt(3))).toBe(true);
  });

  it('refuses every create past the global limit and alerts once', async () => {
    const now = dayAt(4);
    const withinLimit = await takeSlots(
      MAX_SELF_SERVE_SITES_PER_DAY,
      distinctClient,
      now,
    );

    const pastLimit = await takeSlots(
      2,
      (index) => distinctClient(MAX_SELF_SERVE_SITES_PER_DAY + index),
      now,
    );

    expect(withinLimit.every(Boolean)).toBe(true);
    expect(pastLimit).toEqual([false, false]);
    expect(alertSelfServeLimit).toHaveBeenCalledExactlyOnceWith(
      now.toISOString().slice(0, 10),
      MAX_SELF_SERVE_SITES_PER_DAY,
    );
  });

  it('does not alert the operator for a per-IP refusal', async () => {
    await takeSlots(MAX_SITES_PER_IP_PER_DAY + 1, sameClient, dayAt(5));

    expect(alertSelfServeLimit).not.toHaveBeenCalled();
  });
});
