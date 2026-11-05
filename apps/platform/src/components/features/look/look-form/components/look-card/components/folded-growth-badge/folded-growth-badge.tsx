import { useAccordionItem } from '@platform/components/shared/accordion/accordion-context';
import { GrowthBadge } from '@platform/components/shared/growth-badge';

export const FoldedGrowthBadge = () => {
  const { isOpen } = useAccordionItem();

  return isOpen ? null : <GrowthBadge />;
};
