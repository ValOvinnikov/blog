'use client';

import { TextLink } from '@blog/ui/components/atoms/text-link';
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
            <TextLink
              appearance="nav"
              href={isCurrent ? undefined : href}
              lang={lang}
              hrefLang={lang}
              title={label}
              isCurrent={isCurrent}
              className={link()}
              dataTestId={isCurrent ? 'language-code-current' : undefined}
            >
              <span aria-hidden="true">{code}</span>
              <span className={labelClass()}>{label}</span>
            </TextLink>
          </li>
        );
      })}
    </ul>
  );
};
