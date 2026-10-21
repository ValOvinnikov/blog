import { alertSelfServeLimit } from '@platform/server/create-site-gate/alert-self-serve-limit';

import {
  MAX_SELF_SERVE_SITES_PER_DAY,
  MAX_SITES_PER_IP_PER_DAY,
  takeCreateSiteSlot,
} from './create-site-gate';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');
vi.mock('@platform/server/create-site-gate/alert-self-serve-limit', () => ({
  alertSelfServeLimit: vi.fn(),
}));

const alertMock = vi.mocked(alertSelfServeLimit);

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

const sameClient = () => '203.0.113.5';
const distinctClient = (index: number) => `198.51.100.${index}`;

describe('takeCreateSiteSlot', () => {
  beforeEach(() => {
    alertMock.mockReset();
  });

  it('allows creates within the per-IP limit', async () => {
    const results = await takeSlots(
      MAX_SITES_PER_IP_PER_DAY,
      sameClient,
      new Date('2026-01-01T09:00:00Z'),
    );

    expect(results.every(Boolean)).toBe(true);
  });

  it('refuses the create past the per-IP limit for that day', async () => {
    const now = new Date('2026-01-02T09:00:00Z');
    await takeSlots(MAX_SITES_PER_IP_PER_DAY, sameClient, now);

    expect(await takeCreateSiteSlot(sameClient(), now)).toBe(false);
  });

  it('allows the same IP again the next day', async () => {
    await takeSlots(
      MAX_SITES_PER_IP_PER_DAY + 1,
      sameClient,
      new Date('2026-01-03T09:00:00Z'),
    );

    expect(
      await takeCreateSiteSlot(sameClient(), new Date('2026-01-04T09:00:00Z')),
    ).toBe(true);
  });

  it('refuses every create past the global limit and alerts the operator once', async () => {
    const now = new Date('2026-01-05T09:00:00Z');
    const withinLimit = await takeSlots(
      MAX_SELF_SERVE_SITES_PER_DAY,
      distinctClient,
      now,
    );

    const pastLimit = await takeSlots(2, (index) => `192.0.2.${index}`, now);

    expect(withinLimit.every(Boolean)).toBe(true);
    expect(pastLimit).toEqual([false, false]);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith(
      '2026-01-05',
      MAX_SELF_SERVE_SITES_PER_DAY,
    );
  });

  it('does not alert the operator for a per-IP refusal', async () => {
    await takeSlots(
      MAX_SITES_PER_IP_PER_DAY + 1,
      sameClient,
      new Date('2026-01-06T09:00:00Z'),
    );

    expect(alertMock).not.toHaveBeenCalled();
  });
});
