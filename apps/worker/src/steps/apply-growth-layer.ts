import {
  buildGrowthLayer,
  STARTER_DOCUMENT_IDS,
  type Template_home,
  type TStarterDocumentUnion,
  type TStarterSiteType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import type { TAfterSeed } from '@worker/steps/seed-content';
import {
  type THomeModuleSlot,
  withGrowthHomeSlots,
} from '@worker/utils/growth-layer/growth-home-modules';
import { uploadPlaceholderImages } from '@worker/utils/growth-layer/placeholder-images';
import {
  buildLedgerEntry,
  GROWTH_LAYER_LEDGER_ENTRY_ID,
  MIGRATION_LEDGER_ID,
} from '@worker/utils/migration-ledger/migration-ledger';

const GROWTH_LAYER_STATE_QUERY = `{
  "homeTemplate": *[_id == $homeTemplateId][0]{ _rev, modules },
  "ledger": *[_id == $ledgerId][0]{ "isLayerApplied": $entryId in applied[].id }
}`;

type TGrowthLayerState = {
  homeTemplate: TMaybeNull<
    Pick<Template_home, '_rev'> & { modules?: THomeModuleSlot[] }
  >;
  ledger: TMaybeNull<{ isLayerApplied: boolean }>;
};

export function applyGrowthLayer({
  siteType,
  locale,
}: {
  siteType: TStarterSiteType;
  locale: TLocaleIsoCode;
}): TAfterSeed {
  return async (client) => {
    const homeTemplateId = STARTER_DOCUMENT_IDS.HOME_TEMPLATE;
    const { homeTemplate, ledger } = await client.fetch<TGrowthLayerState>(
      GROWTH_LAYER_STATE_QUERY,
      {
        homeTemplateId,
        ledgerId: MIGRATION_LEDGER_ID,
        entryId: GROWTH_LAYER_LEDGER_ENTRY_ID,
      },
    );
    if (ledger?.isLayerApplied) return;

    const placeholderImages = await uploadPlaceholderImages(client);
    const layer = buildGrowthLayer({ siteType, locale, placeholderImages });
    if (!layer) return;

    const transaction = client.transaction();
    for (const document of layer.documents) {
      transaction.createIfNotExists<TStarterDocumentUnion>(document);
    }

    const nextModules =
      homeTemplate &&
      withGrowthHomeSlots(homeTemplate.modules ?? [], layer.homeSlots);
    if (homeTemplate && nextModules) {
      transaction.patch(homeTemplateId, {
        ifRevisionID: homeTemplate._rev,
        set: { modules: nextModules },
      });
    }

    if (ledger) {
      const entry = buildLedgerEntry(
        GROWTH_LAYER_LEDGER_ENTRY_ID,
        new Date().toISOString(),
      );
      transaction.patch(MIGRATION_LEDGER_ID, {
        setIfMissing: { applied: [] },
        insert: { after: 'applied[-1]', items: [entry] },
      });
    }

    await transaction.commit();
  };
}
