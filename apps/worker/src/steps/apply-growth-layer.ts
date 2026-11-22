import {
  buildGrowthLayer,
  STARTER_DOCUMENT_IDS,
  type TStarterDocumentUnion,
  type TStarterSiteType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import {
  type THomeModuleSlot,
  withGrowthHomeSlots,
} from '@worker/utils/growth-layer/growth-home-modules';
import { uploadPlaceholderImages } from '@worker/utils/growth-layer/placeholder-images';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

const HOME_TEMPLATE_MODULES_QUERY = '*[_id == $id][0]{ _rev, modules }';

type THomeTemplateModules = { _rev: string; modules?: THomeModuleSlot[] };

export async function applyGrowthLayer({
  tenantId,
  siteType,
  locale,
}: {
  tenantId: string;
  siteType: TStarterSiteType;
  locale: TLocaleIsoCode;
}): Promise<void> {
  const client = await createTenantWriteClient(tenantId);
  const placeholderImages = await uploadPlaceholderImages(client);
  const layer = buildGrowthLayer({ siteType, locale, placeholderImages });
  if (!layer) return;

  const homeTemplateId = STARTER_DOCUMENT_IDS.HOME_TEMPLATE;
  const homeTemplate = await client.fetch<TMaybeNull<THomeTemplateModules>>(
    HOME_TEMPLATE_MODULES_QUERY,
    { id: homeTemplateId },
  );

  const transaction = client.transaction();
  for (const document of layer.documents) {
    transaction.createIfNotExists<TStarterDocumentUnion>(document);
  }

  if (homeTemplate) {
    const { _rev, modules = [] } = homeTemplate;
    const nextModules = withGrowthHomeSlots(modules, layer.homeSlots);
    if (nextModules) {
      transaction.patch(homeTemplateId, {
        ifRevisionID: _rev,
        set: { modules: nextModules },
      });
    }
  }

  await transaction.commit();
}
