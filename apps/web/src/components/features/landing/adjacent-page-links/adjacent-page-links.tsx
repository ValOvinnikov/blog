import type { IWithClassName } from '@shinefold/config';
import type { TLandingAdjacentPages } from '@shinefold/service';
import { useTranslations } from 'next-intl';

import { adjacentPageLinksVariants } from './adjacent-page-links-variants';
import { AdjacentPageLink } from './components/adjacent-page-link/adjacent-page-link';

interface IAdjacentPageLinksProps extends IWithClassName {
  adjacentPages: TLandingAdjacentPages;
}

const s = adjacentPageLinksVariants();

export const AdjacentPageLinks = ({
  adjacentPages,
  className,
}: IAdjacentPageLinksProps) => {
  const t = useTranslations('sectionNavigation');
  const paginationT = useTranslations('pagination');
  const { previous, next } = adjacentPages;

  return (
    <nav
      aria-label={t('adjacentPages')}
      className={s.root({ class: className })}
    >
      {previous && (
        <AdjacentPageLink
          page={previous}
          direction={paginationT('previous')}
          isNext={false}
        />
      )}
      {next && (
        <AdjacentPageLink
          page={next}
          direction={paginationT('next')}
          isNext={true}
        />
      )}
    </nav>
  );
};
