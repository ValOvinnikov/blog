import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import type { TButtonVariants } from '@platform/components/shared/button/button-variants';
import { LinkButton } from '@platform/components/shared/link-button';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { paginationVariants } from './pagination-variants';

type TPaginationTarget =
  | { pageHref: (page: number) => string; onPageChange?: never }
  | { onPageChange: (page: number) => void; pageHref?: never };

export type TPaginationProps = {
  page: number;
  totalPages: number;
  focusGround?: TButtonVariants['focusGround'];
} & TPaginationTarget;

export const Pagination = ({
  page,
  totalPages,
  pageHref,
  onPageChange,
  focusGround,
}: TPaginationProps) => {
  const t = useTranslations('pagination');
  const { root } = paginationVariants();

  if (totalPages <= 1) return null;

  const renderStep = (target: number, label: string) => {
    const isAvailable = target >= 1 && target <= totalPages;

    if (isAvailable && pageHref) {
      return (
        <LinkButton
          href={pageHref(target)}
          size={SIZE.SM}
          focusGround={focusGround}
        >
          {label}
        </LinkButton>
      );
    }

    if (onPageChange) {
      return (
        <Button
          size={SIZE.SM}
          focusGround={focusGround}
          isAriaDisabled={!isAvailable}
          onClick={() => onPageChange(target)}
        >
          {label}
        </Button>
      );
    }

    return (
      <Button size={SIZE.SM} focusGround={focusGround} isDisabled={true}>
        {label}
      </Button>
    );
  };

  const Root = onPageChange ? 'div' : 'nav';

  return (
    <Root
      className={root()}
      role={onPageChange ? 'group' : undefined}
      aria-label={t('ariaLabel')}
    >
      {renderStep(page - 1, t('previous'))}
      <Text variant="meta">{t('status', { page, totalPages })}</Text>
      {renderStep(page + 1, t('next'))}
    </Root>
  );
};
