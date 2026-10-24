import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { LinkButton } from '@platform/components/shared/link-button';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { paginationVariants } from './pagination-variants';

export type TPaginationProps = {
  page: number;
  totalPages: number;
  pageHref: (page: number) => string;
};

export const Pagination = ({
  page,
  totalPages,
  pageHref,
}: TPaginationProps) => {
  const t = useTranslations('pagination');
  const { root } = paginationVariants();

  if (totalPages <= 1) return null;

  return (
    <nav className={root()} aria-label={t('ariaLabel')}>
      {page > 1 ? (
        <LinkButton href={pageHref(page - 1)} size={SIZE.SM}>
          {t('previous')}
        </LinkButton>
      ) : (
        <Button size={SIZE.SM} isDisabled={true}>
          {t('previous')}
        </Button>
      )}
      <Text variant="meta">{t('status', { page, totalPages })}</Text>
      {page < totalPages ? (
        <LinkButton href={pageHref(page + 1)} size={SIZE.SM}>
          {t('next')}
        </LinkButton>
      ) : (
        <Button size={SIZE.SM} isDisabled={true}>
          {t('next')}
        </Button>
      )}
    </nav>
  );
};
