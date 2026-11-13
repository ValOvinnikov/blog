import { faker } from '@faker-js/faker';

export const MOCK_TENANT_ID = faker.string.uuid();
export const MOCK_TENANT_NAME = 'Acme Inc.';
export const MOCK_TENANT_SLUG = 'acme';
export const MOCK_TENANT_ROOT_DOMAIN = 'example.com';
export const MOCK_TENANT_DOMAIN = `${MOCK_TENANT_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
export const MOCK_SANITY_PROJECT_ID = 'proj-1';
export const MOCK_TENANT_CREATED_AT = new Date('2026-04-02T00:00:00.000Z');
