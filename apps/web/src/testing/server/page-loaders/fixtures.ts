import { faker } from '@faker-js/faker';
import { okResult } from '@shinefold/utils';

export const mockPageLoaderResult = () =>
  okResult({ title: faker.lorem.words(3) });
