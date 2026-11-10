import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import { resolveReferencingModuleTags } from '@web/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags';

export type TBuildRevalidatedTagsInput = {
  baseTags: string[];
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
  tenantProjectId: TMaybeNull<string>;
  tenantSanity: TMaybeUndefined<TTenantSanityContext>;
};

export const buildRevalidatedTags = async ({
  baseTags,
  type,
  id,
  tenantId,
  tenantProjectId,
  tenantSanity,
}: TBuildRevalidatedTagsInput): Promise<string[]> => {
  const moduleTags =
    tenantId && tenantSanity
      ? await resolveReferencingModuleTags({
          type,
          id,
          tenantId,
          tenant: tenantSanity,
        })
      : [];

  const allTags = [...baseTags, ...moduleTags];
  return tenantProjectId
    ? [...allTags, ...allTags.map((tag) => `t:${tenantProjectId}:${tag}`)]
    : allTags;
};
