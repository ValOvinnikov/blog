import { SANITY_PROJECT_ROLE } from '@blog/config';
import {
  MOCK_SANITY_MINTED_TOKEN,
  MOCK_SANITY_TOKEN,
} from '@blog/db/testing/sanity-management-client/fixtures';

import { sanityRoleChangeToken } from './sanity-role-change-token';

const MOCK_TOKENS = {
  organizationToken: MOCK_SANITY_TOKEN,
  projectToken: MOCK_SANITY_MINTED_TOKEN,
};

describe(sanityRoleChangeToken, () => {
  it('uses the organisation token for an administrator role change', () => {
    expect(
      sanityRoleChangeToken({
        ...MOCK_TOKENS,
        roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      }),
    ).toBe(MOCK_SANITY_TOKEN);
  });

  it.each([SANITY_PROJECT_ROLE.VIEWER, SANITY_PROJECT_ROLE.EDITOR])(
    'uses the project token for a %s role change',
    (roleName) => {
      expect(sanityRoleChangeToken({ ...MOCK_TOKENS, roleName })).toBe(
        MOCK_SANITY_MINTED_TOKEN,
      );
    },
  );
});
