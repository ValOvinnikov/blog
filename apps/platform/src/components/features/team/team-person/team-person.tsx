import { Avatar } from '@platform/components/shared/avatar';
import { Text } from '@platform/components/shared/text';
import type { AVATAR_VARIANT } from '@platform/constants/avatar';
import type { TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { teamPersonVariants } from './team-person-variants';

export type TTeamPersonProps = {
  email: TMaybeUndefined<string>;
  avatarVariant: typeof AVATAR_VARIANT.MEMBER | typeof AVATAR_VARIANT.PENDING;
  isYou?: boolean;
  detail: ReactNode;
  stackedDetail: ReactNode;
};

export const TeamPerson = ({
  email,
  avatarVariant,
  isYou = false,
  detail,
  stackedDetail,
}: TTeamPersonProps) => {
  const t = useTranslations('teamPage.members');
  const {
    root,
    lines,
    address,
    detail: detailSlot,
    stackedDetail: stackedDetailSlot,
  } = teamPersonVariants({ hasEmail: !!email });

  return (
    <div className={root()}>
      <Avatar name="" email={email} variant={avatarVariant} />
      <div className={lines()}>
        <span className={address()}>
          {email ?? t('noEmail')}
          {isYou && (
            <>
              {' '}
              <Text as="span" variant="meta">
                {t('you')}
              </Text>
            </>
          )}
        </span>
        <span className={detailSlot()}>{detail}</span>
        <span className={stackedDetailSlot()}>{stackedDetail}</span>
      </div>
    </div>
  );
};
