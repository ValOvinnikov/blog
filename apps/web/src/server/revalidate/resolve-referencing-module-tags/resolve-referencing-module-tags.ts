import { service, type TTenantSanityContext } from '@blog/service';
import { logger } from '@web/utils/logger/logger';

export type TResolveReferencingModuleTagsInput = {
  type: string;
  id: string;
  tenantId: string;
  tenant: TTenantSanityContext;
};

/**
 * The `module:<id>` tags for every module whose cached markup embeds this
 * document — a CTA's link target slug, or a directly referenced document.
 */
export const resolveReferencingModuleTags = async ({
  type,
  id,
  tenantId,
  tenant,
}: TResolveReferencingModuleTagsInput): Promise<string[]> => {
  const result = await service.entities.modules.v1.getReferencingModuleIds(
    id,
    tenant,
  );

  if (!result.ok) {
    logger.error('revalidate.referencing_modules_lookup_failed', {
      type,
      id,
      tenantId,
      error: result.error,
    });
    return [];
  }

  return result.data.map((moduleId) => `module:${moduleId}`);
};
