'use client';

import { NavLink } from '@blog/ui/components/atoms/nav-link';
import type { TLanguageEntry } from '@web/components/shared/language-switcher/to-language-entries';

import { languageCodesVariants } from './language-codes-variants';

export type TLanguageCodesProps = {
  entries: TLanguageEntry[];
  isInFooter?: boolean;
};

export const LanguageCodes = ({
  entries,
  isInFooter = false,
}: TLanguageCodesProps) => {
  const { list } = languageCodesVariants({ isInFooter });

  return (
    <ul className={list()}>
      {entries.map(({ locale, href, lang, label, code, isCurrent }) => {
        const { link, label: labelClass } = languageCodesVariants({
          isInFooter,
          isCurrent,
        });

        return (
          <li key={locale}>
            {isCurrent ? (
              <NavLink
                as="span"
                lang={lang}
                title={label}
                isActive={true}
                aria-current="true"
                className={link()}
                dataTestId="language-code-current"
              >
                <span aria-hidden="true">{code}</span>
                <span className={labelClass()}>{label}</span>
              </NavLink>
            ) : (
              <NavLink
                href={href}
                lang={lang}
                hrefLang={lang}
                title={label}
                aria-label={label}
                className={link()}
              >
                {code}
              </NavLink>
            )}
          </li>
        );
      })}
    </ul>
  );
};
