import { GrantModulePackControl } from '@platform/components/features/entitlement-grants/grant-module-pack-control';
import { Card } from '@platform/components/shared/card';
import { CardList } from '@platform/components/shared/card-list';
import {
  GRANT_STATUS,
  GRANTS_CARD_HEADING_ID,
} from '@platform/constants/entitlement-grant';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { TGrantRow } from '@platform/utils/to-grant-rows/to-grant-rows';
import type { TMaybeUndefined } from '@shinefold/config';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { GrantRow } from './components/grant-row/grant-row';

export type TGrantsCardProps = {
  grants: TGrantRow[];
  target: TMaybeUndefined<TGrantTarget>;
};

export const GrantsCard = ({ grants, target }: TGrantsCardProps) => {
  const t = useTranslations('grantsCard');
  const grantedPacks = grants
    .filter(
      ({ kind, status }) =>
        kind === ENTITLEMENT_KIND.MODULE_PACK &&
        status !== GRANT_STATUS.EXPIRED,
    )
    .map(({ key }) => key);

  return (
    <Card>
      <Card.Header
        title={t('title')}
        titleId={GRANTS_CARD_HEADING_ID}
        titleTabIndex={-1}
        supportingText={t('supportingText')}
        actions={
          target && (
            <GrantModulePackControl
              target={target}
              grantedPacks={grantedPacks}
            />
          )
        }
      />
      <Card.Body>
        <CardList
          items={grants}
          emptyMessage={t('empty')}
          renderRow={(grant) => (
            <GrantRow key={grant.id} grant={grant} target={target} />
          )}
        />
      </Card.Body>
    </Card>
  );
};
