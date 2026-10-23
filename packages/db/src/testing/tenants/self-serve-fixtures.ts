import { faker } from '@faker-js/faker';

const EMAIL_DOMAIN = faker.internet.domainName();
const OWNER_LOCAL_PART = faker.string.alpha({ length: 8 }).toLowerCase();

export const MOCK_SELF_SERVE_NAME = faker.company.name();
export const MOCK_SELF_SERVE_DOMAIN = faker.internet.domainName();
export const MOCK_SELF_SERVE_OTHER_DOMAIN = `other.${MOCK_SELF_SERVE_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_OTHER_USER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_MISSING_USER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_OWNER_EMAIL = `${OWNER_LOCAL_PART}@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL = `${OWNER_LOCAL_PART}+promo@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL = ` ${MOCK_SELF_SERVE_OWNER_EMAIL.toUpperCase()}`;
export const MOCK_SELF_SERVE_OTHER_EMAIL = `${faker.string.alpha({ length: 9 }).toLowerCase()}@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_SCHEME_DOMAIN = `https://${MOCK_SELF_SERVE_DOMAIN}`;
export const MOCK_SELF_SERVE_PADDED_DOMAIN = ` ${MOCK_SELF_SERVE_DOMAIN} `;
