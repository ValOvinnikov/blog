import { faker } from '@faker-js/faker';

import { deepMergePartial, type TDeepPartial } from './deep-merge';

faker.seed(6029);

type TFixture = {
  a: { x: string; y: string };
  b: string;
};

const MOCK_BASE: TFixture = {
  a: { x: faker.lorem.word(), y: faker.lorem.word() },
  b: faker.lorem.word(),
};
const MOCK_FIRST_X = faker.string.uuid();
const MOCK_FIRST_B = faker.string.uuid();
const MOCK_SECOND_X = faker.string.uuid();

describe(deepMergePartial, () => {
  it('replaces only the nested leaf an override sets', () => {
    const result = deepMergePartial(MOCK_BASE, { a: { x: MOCK_FIRST_X } });

    expect(result).toEqual({
      ...MOCK_BASE,
      a: { ...MOCK_BASE.a, x: MOCK_FIRST_X },
    });
  });

  it('applies multiple overrides left-to-right, each later one winning', () => {
    const result = deepMergePartial(
      MOCK_BASE,
      { a: { x: MOCK_FIRST_X }, b: MOCK_FIRST_B },
      { a: { x: MOCK_SECOND_X } },
    );

    expect(result).toEqual({
      a: { ...MOCK_BASE.a, x: MOCK_SECOND_X },
      b: MOCK_FIRST_B,
    });
  });

  it.each<[string, TDeepPartial<TFixture> | undefined]>([
    ['an empty override', {}],
    ['an undefined override', undefined],
  ])('returns the base unchanged for %s', (_label, override) => {
    expect(deepMergePartial(MOCK_BASE, override)).toEqual(MOCK_BASE);
  });
});
