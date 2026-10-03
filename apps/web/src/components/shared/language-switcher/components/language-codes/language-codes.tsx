'use client';

import { NavLink } from '@blog/ui/components/atoms/nav-link';
import type { TLanguageEntry } from '@web/components/shared/language-switcher/to-language-entries';
import { rememberLanguage } from '@web/utils/language-cookie/language-cookie';

import { languageCodesVariants } from './language-codes-variants';

export type TLanguageCodesProps = {
  entries: TLanguageEntry[];
  isInFooter?: boolean;
};

export const LanguageCodes = ({
  entries,
  isInFooter = false,
}: TLanguageCodesProps) => {
  const { list, item, link } = languageCodesVariants({ isInFooter });

  return (
    <ul className={list()}>
      {entries.map((entry) => (
        <li key={entry.locale} className={item()}>
          <NavLink
            href={entry.href}
            lang={entry.lang}
            hrefLang={entry.hrefLang}
            title={entry.label}
            aria-label={entry.label}
            isActive={entry.isCurrent}
            onClick={() => rememberLanguage(entry.locale)}
            className={link()}
          >
            {entry.code}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};
