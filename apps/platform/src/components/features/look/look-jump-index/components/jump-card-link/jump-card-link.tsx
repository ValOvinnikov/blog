import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookCard } from '@platform/constants/look-card';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { jumpCardLinkVariants } from './jump-card-link-variants';

export type TJumpCardLinkProps = {
  card: TLookCard;
  label: string;
  isCurrent: boolean;
  isDirty: boolean;
  isPhone: boolean;
  onSelect: (card: TLookCard) => void;
  ref?: Ref<HTMLAnchorElement>;
};

export const JumpCardLink = ({
  card,
  label,
  isCurrent,
  isDirty,
  isPhone,
  onSelect,
  ref,
}: TJumpCardLinkProps) => {
  const t = useTranslations('lookForm');
  const { link, srOnly } = jumpCardLinkVariants({ isPhone, isCurrent });

  return (
    <a
      ref={ref}
      href={`#${toLookAnchorId(card)}`}
      aria-current={isCurrent ? 'location' : undefined}
      onClick={(event) => {
        event.preventDefault();
        onSelect(card);
      }}
      className={link()}
    >
      {label}
      {isDirty && (
        <>
          <UnsavedDot isDecorative={true} />
          <span className={srOnly()}>{t('jumpIndexUnsaved')}</span>
        </>
      )}
    </a>
  );
};
