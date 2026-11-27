import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookSubsection } from '@platform/components/features/look/look-form/components/look-subsection';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

import { AccountFields } from './components/account-fields/account-fields';
import { HeaderActionFields } from './components/header-action-fields/header-action-fields';
import { HeaderControlShapeField } from './components/header-control-shape-field/header-control-shape-field';
import { HeaderControlStyleField } from './components/header-control-style-field/header-control-style-field';
import { HeaderLayoutFields } from './components/header-layout-fields/header-layout-fields';
import { LanguageSwitcherStyleField } from './components/language-switcher-style-field/language-switcher-style-field';
import { NavLinkStyleField } from './components/nav-link-style-field/nav-link-style-field';

export type THeaderCardProps = {
  hasMultipleLanguages: boolean;
  summary: string;
};

export const HeaderCard = ({
  hasMultipleLanguages,
  summary,
}: THeaderCardProps) => {
  const t = useTranslations('lookForm');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.HEADER],
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.HEADER}
      description={t('headerDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookSubsection heading={t('headerLayoutHeading')}>
        <HeaderLayoutFields />
      </LookSubsection>
      <LookSubsection heading={t('headerLinksHeading')}>
        <NavLinkStyleField />
      </LookSubsection>
      <LookSubsection heading={t('headerButtonsHeading')}>
        <HeaderControlStyleField />
        <HeaderControlShapeField />
        <LanguageSwitcherStyleField
          hasMultipleLanguages={hasMultipleLanguages}
        />
      </LookSubsection>
      <LookSubsection heading={t('headerActionHeading')}>
        <HeaderActionFields />
      </LookSubsection>
      <LookSubsection heading={t('headerAccountHeading')}>
        <AccountFields />
      </LookSubsection>
    </LookCard>
  );
};
