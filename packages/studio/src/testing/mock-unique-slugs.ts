import { faker } from '@faker-js/faker';

export const mockUniqueSlugs = <const TKey extends string>(
  keys: readonly TKey[],
): Record<TKey, string> => {
  const slugs = faker.helpers.uniqueArray(
    () => faker.lorem.word(),
    keys.length,
  );

  return Object.fromEntries(
    keys.map((key, index) => [key, slugs[index]]),
  ) as Record<TKey, string>;
};
