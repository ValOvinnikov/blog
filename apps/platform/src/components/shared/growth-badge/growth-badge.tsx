import { StatusBadge } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';

type TGrowthBadgeProps = {
  id?: string;
};

export const GrowthBadge = ({ id }: TGrowthBadgeProps) => {
  const t = useTranslations('growthBadge');

  return (
    <StatusBadge id={id} tone="growth" hasDot={false}>
      {t('label')} <span className="sr-only">{t('planNote')}</span>
    </StatusBadge>
  );
};
