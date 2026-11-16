import { faker } from '@faker-js/faker';

export const mockItemsWithIds = <TItem>(
  count: number,
  mockItem: (overrides: { id: string }) => TItem,
): TItem[] =>
  Array.from({ length: count }, () => mockItem({ id: faker.string.uuid() }));
