import { faker } from '@faker-js/faker';
import { DynamicServerError } from 'next/dist/client/components/hooks-server-context';

export const MOCK_ERROR_MESSAGE = faker.lorem.sentence();

export const MOCK_ERROR = new Error(MOCK_ERROR_MESSAGE);

export const MOCK_DYNAMIC_SERVER_USAGE_ERROR = new DynamicServerError(
  "Route /[tenant]/[locale] couldn't be rendered statically because it used `headers`",
);
