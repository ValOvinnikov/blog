import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { jumpCardLinkVariants } from './jump-card-link-variants';

export type TJumpCardLinkProps = {
  card: TLookCard;
  isCurrent: boolean;
  isPhone: boolean;
  onSelect: (card: TLookCard) => void;
  ref?: Ref<HTMLAnchorElement>;
};

export const JumpCardLink = ({
  card,
  isCurrent,
  isPhone,
  onSelect,
  ref,
}: TJumpCardLinkProps) => {
  const t = useTranslations('lookForm');
  const { hasCardChanges } = useLookForm();
  const { item, link, srOnly } = jumpCardLinkVariants({ isPhone, isCurrent });

  return (
    <li className={item()}>
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
        {card === LOOK_CARD.PRESET
          ? t('presetLabel')
          : t(LOOK_ROW_TITLE_KEY[card])}
        {hasCardChanges(card) && (
          <>
            <UnsavedDot isDecorative={true} />
            <span className={srOnly()}>{t('jumpIndexUnsaved')}</span>
          </>
        )}
      </a>
    </li>
  );
};
