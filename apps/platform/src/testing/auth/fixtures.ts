import { faker } from '@faker-js/faker';

const MOCK_OFF_ORIGIN_HOST = faker.internet.domainName();

export const MOCK_SIGN_IN_HREF = '/sign-in?callbackUrl=%2F';
export const MOCK_SIGN_IN_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_SIGN_IN_USER_ID = faker.string.uuid();
export const MOCK_OFF_ORIGIN_PATH = `//${MOCK_OFF_ORIGIN_HOST}`;
export const MOCK_OFF_ORIGIN_URL = `https://${MOCK_OFF_ORIGIN_HOST}/`;

const MOCK_PLATFORM_ORIGIN = `https://${faker.internet.domainName()}`;

export const MOCK_AUTH_ERROR_TYPE = 'EmailSignInError';
export const MOCK_VERIFY_REQUEST_URL = `${MOCK_PLATFORM_ORIGIN}/api/auth/verify-request?provider=email&type=email`;
export const MOCK_AUTH_ERROR_URL = `${MOCK_PLATFORM_ORIGIN}/sign-in-error?error=${MOCK_AUTH_ERROR_TYPE}`;
