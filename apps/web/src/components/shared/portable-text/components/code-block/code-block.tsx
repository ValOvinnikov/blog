import { useTranslations } from 'next-intl';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { codeBlockSyntaxTheme } from './code-block-syntax-theme';
import { codeBlockVariants } from './code-block-variants';

export interface ICodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  highlightedLines?: number[];
}

/**
 * Not a `@blog/ui` component: it wraps the third-party
 * `react-syntax-highlighter`, which `@blog/ui` must stay free of per the
 * layer contract.
 */
export const CodeBlock = ({
  code,
  language,
  filename,
  highlightedLines,
}: ICodeBlockProps) => {
  const t = useTranslations('codeBlock');
  const s = codeBlockVariants();

  return (
    <figure className={s.root()}>
      {filename ? (
        <figcaption className={s.filename()} data-testid="filename-caption">
          {filename}
        </figcaption>
      ) : null}
      <SyntaxHighlighter
        language={language ?? 'text'}
        style={codeBlockSyntaxTheme}
        showLineNumbers={true}
        wrapLines={true}
        lineProps={(lineNumber) => ({
          'data-testid': 'code-line',
          ...(highlightedLines?.includes(lineNumber)
            ? { className: s.highlightedLine() }
            : {}),
        })}
        className={s.pre()}
        tabIndex={0}
        role="region"
        aria-label={t('regionLabel')}
        data-testid="code-content"
      >
        {code}
      </SyntaxHighlighter>
    </figure>
  );
};
