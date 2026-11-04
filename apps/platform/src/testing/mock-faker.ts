import { faker, type Faker } from '@faker-js/faker';

type TFakerConstructor = new (options: {
  locale: Faker['rawDefinitions'];
}) => Faker;

export const createMockFaker = (seed: number): Faker => {
  const FakerClass = faker.constructor as TFakerConstructor;
  const mockFaker = new FakerClass({ locale: faker.rawDefinitions });
  mockFaker.seed(seed);

  return mockFaker;
};
