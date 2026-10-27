import { NEXT_DYNAMIC_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';

faker.seed(61054);

const MOCK_ERROR_MESSAGE = faker.lorem.sentence();

export const MOCK_ERROR = new Error(MOCK_ERROR_MESSAGE);

export const MOCK_DYNAMIC_SERVER_USAGE_ERROR = Object.assign(
  new Error(
    "Dynamic server usage: Route /[tenant]/[locale] couldn't be rendered statically because it used `headers`",
  ),
  { digest: NEXT_DYNAMIC_ERROR.DYNAMIC_SERVER_USAGE },
);

export const MOCK_ERROR_DIGEST = faker.string.uuid();

export const MOCK_ERROR_WITH_DIGEST = Object.assign(
  new Error(faker.lorem.sentence()),
  { digest: MOCK_ERROR_DIGEST },
);
