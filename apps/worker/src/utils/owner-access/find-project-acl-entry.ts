import { SANITY_RESOURCE_TYPE } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TSanityAclEntry } from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';

// The ACL keys a member on their project membership's `resourceUserId`, which differs from `profile.id` for a member who joined through an Access API invite.
export function findProjectAclEntry(
  acl: TSanityAclEntry[],
  user: TSanityUser,
  projectId: string,
): TMaybeUndefined<TSanityAclEntry> {
  const projectUserIds = [
    ...(user.memberships ?? []).flatMap(
      ({ resourceType, resourceId, resourceUserId }) =>
        resourceType === SANITY_RESOURCE_TYPE.PROJECT &&
        resourceId === projectId &&
        resourceUserId
          ? [resourceUserId]
          : [],
    ),
    user.profile.id,
  ];
  return acl.find(({ projectUserId }) =>
    projectUserIds.includes(projectUserId),
  );
}
