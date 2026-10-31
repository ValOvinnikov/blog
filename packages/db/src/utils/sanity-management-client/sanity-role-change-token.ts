import { SANITY_PROJECT_ROLE } from '@blog/config';

// Sanity refuses a project-scoped token any change to an `administrator` role.
export function sanityRoleChangeToken(input: {
  roleName: string;
  organizationToken: string;
  projectToken: string;
}): string {
  return input.roleName === SANITY_PROJECT_ROLE.ADMINISTRATOR
    ? input.organizationToken
    : input.projectToken;
}
