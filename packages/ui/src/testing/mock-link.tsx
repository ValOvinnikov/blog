import type { AnchorHTMLAttributes } from 'react';

export const MOCK_LINK_TEST_ID = 'mock-link';

export const MockLink = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const { children, className, href, hrefLang, lang, rel, target, title } =
    props;

  return (
    <a
      className={className}
      href={href}
      hrefLang={hrefLang}
      lang={lang}
      rel={rel}
      target={target}
      title={title}
      aria-current={props['aria-current']}
      aria-label={props['aria-label']}
      data-testid={MOCK_LINK_TEST_ID}
    >
      {children}
    </a>
  );
};
