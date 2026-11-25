import { faker } from '@faker-js/faker';

export const mockTextBlock = (...texts: string[]) => ({
  _type: 'block',
  _key: faker.string.alphanumeric(12),
  children: texts.map((text) => ({
    _type: 'span',
    _key: faker.string.alphanumeric(12),
    text,
  })),
});
