import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildDocumentValidationAlertEmail } from './document-validation-alert';

faker.seed(6026);

const MOCK_INVALID_DOCUMENT_COUNT = faker.number.int({ min: 1000, max: 9999 });
const MOCK_ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
  isCritical: false,
};

describe(buildDocumentValidationAlertEmail, () => {
  it.each([
    [
      'tenant name',
      'tenantName',
      `<strong>${MOCK_ESCAPED_UNSAFE_MARKUP}</strong>`,
    ],
    ['tenant id', 'tenantId', `<code>${MOCK_ESCAPED_UNSAFE_MARKUP}</code>`],
  ] as const)('escapes the %s', (_name, key, expected) => {
    const { html } = buildDocumentValidationAlertEmail({
      ...MOCK_ALERT,
      [key]: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(expected);
  });

  it('names the tenant and its id in the subject', () => {
    const { subject } = buildDocumentValidationAlertEmail(MOCK_ALERT);

    expect(subject).toContain(MOCK_TENANT_NAME);
    expect(subject).toContain(MOCK_TENANT_ID);
  });

  it('words a critical alert differently from a warning', () => {
    const critical = buildDocumentValidationAlertEmail({
      ...MOCK_ALERT,
      isCritical: true,
    });
    const warning = buildDocumentValidationAlertEmail(MOCK_ALERT);

    expect(critical.html).not.toBe(warning.html);
  });

  it('states how many documents are invalid', () => {
    const { html } = buildDocumentValidationAlertEmail(MOCK_ALERT);

    expect(html).toContain(String(MOCK_INVALID_DOCUMENT_COUNT));
  });
});
