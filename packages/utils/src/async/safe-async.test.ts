import { faker } from '@faker-js/faker';

import { safeAsync } from './safe-async';

faker.seed(6029);

const MOCK_DATA = faker.number.int();
const MOCK_ERROR = new Error(faker.lorem.sentence());
const MOCK_THROWN_STRING = faker.lorem.sentence();
const MOCK_COUNT = faker.number.int();
const MOCK_LABEL = faker.lorem.word();

describe(safeAsync, () => {
  it('returns ok:true with resolved data', async () => {
    const result = await safeAsync(() => Promise.resolve(MOCK_DATA))();

    expect(result).toEqual({ ok: true, data: MOCK_DATA });
  });

  it.each([
    ['an Error', MOCK_ERROR],
    ['a non-Error value', MOCK_THROWN_STRING],
  ])('returns ok:false with %s it rejects with', async (_label, reason) => {
    const result = await safeAsync(() => Promise.reject(reason))();

    expect(result).toEqual({ ok: false, error: reason });
  });

  it('forwards multiple arguments to the wrapped function', async () => {
    const fn = async (count: number, label: string) => `${label}-${count}`;

    const result = await safeAsync(fn)(MOCK_COUNT, MOCK_LABEL);

    expect(result).toEqual({ ok: true, data: `${MOCK_LABEL}-${MOCK_COUNT}` });
  });
});
