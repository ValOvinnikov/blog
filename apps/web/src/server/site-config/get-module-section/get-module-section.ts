import type { TMaybeUndefined } from '@shinefold/config';
import type { TModuleSection } from '@web/components/shared/section';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import type { TSectionStyleOverrides } from '@web/utils/gate-section-style-overrides';

type TModuleSectionSource = Pick<TModuleSection, 'brandVariant' | 'layout'> &
  TSectionStyleOverrides;

export const getModuleSection = async <
  TModuleData extends TModuleSectionSource,
>(
  tenantId: TMaybeUndefined<string>,
  {
    brandVariant,
    layout,
    cardStyle,
    radiusScale,
    density,
    ...content
  }: TModuleData,
): Promise<{
  section: TModuleSection;
  content: Omit<TModuleData, keyof TModuleSectionSource>;
}> => {
  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

  return { section: { brandVariant, layout, appearance }, content };
};
