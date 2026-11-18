import { CardList } from '@platform/components/shared/card-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { GRANT_STATUS } from '@platform/constants/entitlement-grant';
import { formatDate } from '@platform/utils/format-date/format-date';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { TGrantRow } from '@platform/utils/to-grant-rows/to-grant-rows';
import type { TMaybeUndefined } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { useLocale, useTranslations } from 'next-intl';

import { RevokeGrantControl } from './components/revoke-grant-control/revoke-grant-control';
import { useGrantItemLabel } from './use-grant-item-label';

export type TGrantRowProps = {
  grant: TGrantRow;
  target: TMaybeUndefined<TGrantTarget>;
};

export const GrantRow = ({ grant, target }: TGrantRowProps) => {
  const t = useTranslations('grantsCard');
  const tActivity = useTranslations('activityList');
  const locale = useLocale();
  const labelOf = useGrantItemLabel();
  const { id, kind, note, grantedByEmail, grantedAt, expiresAt, status } =
    grant;
  const isExpired = status === GRANT_STATUS.EXPIRED;
  const itemLabel = labelOf(grant);
  const meta = {
    who: grantedByEmail ?? tActivity('actorDeleted'),
    date: formatDate(grantedAt, locale),
  };
  const metaLine = isNull(expiresAt)
    ? t('metaUntilRevoked', meta)
    : t(isExpired ? 'metaExpired' : 'metaExpires', {
        ...meta,
        expiry: formatDate(expiresAt, locale),
      });

  return (
    <CardList.Row align="start">
      <CardList.Primary>
        {itemLabel}
        <StatusBadge hasDot={false}>{t(`kind.${kind}`)}</StatusBadge>
        {isExpired && (
          <StatusBadge tone={BADGE_TONE.WARN}>{t('expired')}</StatusBadge>
        )}
        {status === GRANT_STATUS.INCLUDED && (
          <StatusBadge hasDot={false}>{t('included')}</StatusBadge>
        )}
      </CardList.Primary>
      <CardList.Secondary>{metaLine}</CardList.Secondary>
      {note ? (
        <CardList.Footer>
          <Text variant="meta">{note}</Text>
        </CardList.Footer>
      ) : null}
      {target && (
        <RevokeGrantControl
          target={target}
          grantId={id}
          itemLabel={itemLabel}
          isExpired={isExpired}
        />
      )}
    </CardList.Row>
  );
};
