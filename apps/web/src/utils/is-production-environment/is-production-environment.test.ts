import { faker } from '@faker-js/faker';

import {
  isProductionEnvironment,
  PRODUCTION_DATASET,
} from './is-production-environment';

faker.seed(119);

const MOCK_OTHER_DATASET = faker.lorem.word();

const mockEnv = vi.hoisted(() => ({ NEXT_PUBLIC_SANITY_DATASET: '' }));

vi.mock('@web/utils/env/env', () => ({ env: mockEnv }));

describe(isProductionEnvironment, () => {
  it.each([
    { dataset: PRODUCTION_DATASET, expected: true },
    { dataset: MOCK_OTHER_DATASET, expected: false },
  ])('is $expected for the $dataset dataset', ({ dataset, expected }) => {
    mockEnv.NEXT_PUBLIC_SANITY_DATASET = dataset;

    expect(isProductionEnvironment()).toBe(expected);
  });
});
