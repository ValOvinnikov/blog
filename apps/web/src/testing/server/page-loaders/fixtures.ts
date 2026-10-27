import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';

export const mockPageLoaderResult = () =>
  okResult({ title: faker.lorem.words(3) });
