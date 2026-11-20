import { TEAM_COLUMN } from '@platform/constants/team-access';
import { useTranslations } from 'next-intl';

import { teamTableColumnsVariants } from './use-team-table-columns-variants';

const PERSON_SHARE = 1.5;
const ACCESS_SHARE = 1.7;

const shareOfRest = (share: number) =>
  `${(share / (PERSON_SHARE + ACCESS_SHARE)) * 100}%` as const;

export const useTeamTableColumns = () => {
  const t = useTranslations('teamPage');

  return [
    {
      key: TEAM_COLUMN.PERSON,
      label: t('columnPerson'),
      width: shareOfRest(PERSON_SHARE),
    },
    { key: TEAM_COLUMN.ROLE, label: t('columnRole'), width: '96px' as const },
    {
      key: TEAM_COLUMN.ACCESS,
      label: t('columnStudioAccess'),
      width: shareOfRest(ACCESS_SHARE),
    },
    {
      key: TEAM_COLUMN.ACTIONS,
      label: (
        <span className={teamTableColumnsVariants()}>{t('columnActions')}</span>
      ),
      width: '128px' as const,
    },
  ];
};
