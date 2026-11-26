import type { THeaderActionStyle } from '@shinefold/config';
import { PrimaryNavigationAction } from '@shinefold/ui/components/molecules/primary-navigation/components/action/primary-navigation-action';
import { useTranslations } from 'next-intl';

export type TSampleHeaderActionProps = {
  actionStyle: THeaderActionStyle;
};

export const SampleHeaderAction = ({
  actionStyle,
}: TSampleHeaderActionProps) => {
  const t = useTranslations('lookPreview');

  return (
    <PrimaryNavigationAction
      action={{ label: t('headerAction'), href: '#', style: actionStyle }}
    />
  );
};
