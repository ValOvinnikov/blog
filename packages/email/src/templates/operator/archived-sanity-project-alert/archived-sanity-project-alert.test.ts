import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildArchivedSanityProjectAlertEmail } from './archived-sanity-project-alert';

faker.seed(6026);

const MOCK_SANITY_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_MANAGE_URL = `${MOCK_URL}/manage/project/${MOCK_SANITY_PROJECT_ID}`;
const MOCK_ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  sanityProjectId: MOCK_SANITY_PROJECT_ID,
  manageUrl: MOCK_MANAGE_URL,
};

describe(buildArchivedSanityProjectAlertEmail, () => {
  describe('for an archived project', () => {
    let email: ReturnType<typeof buildArchivedSanityProjectAlertEmail>;

    beforeEach(() => {
      email = buildArchivedSanityProjectAlertEmail(MOCK_ALERT);
    });

    it('names the tenant and its id in the subject', () => {
      expect(email.subject).toContain(MOCK_TENANT_NAME);
      expect(email.subject).toContain(MOCK_TENANT_ID);
    });

    it.each(['html', 'text'] as const)(
      'names the tenant, its id and the project in the %s body',
      (part) => {
        expect(email[part]).toContain(MOCK_TENANT_NAME);
        expect(email[part]).toContain(MOCK_TENANT_ID);
        expect(email[part]).toContain(MOCK_SANITY_PROJECT_ID);
      },
    );

    it('links to the project in Sanity Manage', () => {
      expect(email.html).toContain(`href="${MOCK_MANAGE_URL}"`);
    });

    it('ends the plain text with the Sanity Manage link', () => {
      expect(email.text.endsWith(`: ${MOCK_MANAGE_URL}`)).toBe(true);
    });
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildArchivedSanityProjectAlertEmail({
      ...MOCK_ALERT,
      tenantName: MOCK_UNSAFE_MARKUP,
      tenantId: MOCK_UNSAFE_MARKUP,
      sanityProjectId: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});
