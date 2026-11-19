import { TEAM_COLUMN } from '@platform/constants/team-access';
import { useTranslations } from 'next-intl';

import { teamTableColumnsVariants } from './team-table-columns-variants';

// Person and Studio access split what Role and actions leave 1.5 : 1.7, since a `<col>` takes no `fr`.
export const useTeamTableColumns = () => {
  const t = useTranslations('teamPage');

  return [
    {
      key: TEAM_COLUMN.PERSON,
      label: t('columnPerson'),
      width: '46.875%' as const,
    },
    { key: TEAM_COLUMN.ROLE, label: t('columnRole'), width: '96px' as const },
    {
      key: TEAM_COLUMN.ACCESS,
      label: t('columnStudioAccess'),
      width: '53.125%' as const,
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
