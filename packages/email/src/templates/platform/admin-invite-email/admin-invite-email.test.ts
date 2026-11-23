import { faker } from '@faker-js/faker';
import { MOCK_PLATFORM_MAGIC_LINK_URL } from '@shinefold/email/testing/email-fixtures';

import {
  buildAdminInviteEmail,
  type TAdminInviteEmailInput,
} from './admin-invite-email';

faker.seed(7865);

const MOCK_INVITER_NAME = faker.person.fullName();
const MOCK_ROLE_LABEL = faker.lorem.words(2);
const MOCK_INPUT: TAdminInviteEmailInput = {
  inviterName: MOCK_INVITER_NAME,
  roleLabel: MOCK_ROLE_LABEL,
  url: MOCK_PLATFORM_MAGIC_LINK_URL,
};

describe(buildAdminInviteEmail, () => {
  describe('with an inviter, a role and a magic link', () => {
    let email: ReturnType<typeof buildAdminInviteEmail>;

    beforeEach(() => {
      email = buildAdminInviteEmail(MOCK_INPUT);
    });

    it('names the inviter in the subject', () => {
      expect(email.subject).toContain(MOCK_INVITER_NAME);
    });

    it('names the inviter and the role offered in the body', () => {
      expect(email.html).toContain(MOCK_INVITER_NAME);
      expect(email.html).toContain(MOCK_ROLE_LABEL);
    });

    it('links the magic link in the button', () => {
      expect(email.html).toContain(`href="${MOCK_PLATFORM_MAGIC_LINK_URL}"`);
    });

    it('carries the inviter, the role and the magic link in the plain text', () => {
      expect(email.text).toContain(MOCK_INVITER_NAME);
      expect(email.text).toContain(MOCK_ROLE_LABEL);
      expect(email.text).toContain(MOCK_PLATFORM_MAGIC_LINK_URL);
    });
  });
});
