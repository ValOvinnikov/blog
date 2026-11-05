import type { IWithClassName } from '@blog/config/types';
import {
  revealFirstInvalidControl,
  type TInvalidControls,
} from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';

type TFirstInvalidFieldLinkProps = IWithClassName & {
  invalidControls: TInvalidControls;
};

export const FirstInvalidFieldLink = ({
  invalidControls,
  className,
}: TFirstInvalidFieldLinkProps) => {
  const t = useTranslations('saveBar');
  const [firstInvalidControlId] = invalidControls.ids;

  const goToFirstField = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    revealFirstInvalidControl(invalidControls);
  };

  return (
    <a
      href={`#${firstInvalidControlId}`}
      onClick={goToFirstField}
      className={className}
    >
      {t('goToFirstField')}
    </a>
  );
};
