import { LOCALE_ISO_CODES } from '@blog/config';
import type { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import type { TContactMessageSource } from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import { MOCK_CONTACT_MESSAGE } from '@web/testing/modules/contact-form/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const MOCK_LEAD_SOURCE_PATH = `/${faker.lorem.slug()}`;

export const MOCK_LEAD_SOURCE: TContactMessageSource = {
  sourceDocumentId: faker.string.uuid(),
  sourceLocale: LOCALE_ISO_CODES.NL,
};

export const mockLeadInput = (
  overrides: Partial<queries.leads.TCreateLeadInput> = {},
): queries.leads.TCreateLeadInput => ({
  tenantId: MOCK_TENANT_ID,
  ...MOCK_CONTACT_MESSAGE,
  sourcePath: MOCK_LEAD_SOURCE_PATH,
  ...MOCK_LEAD_SOURCE,
  ...overrides,
});
