import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { codeBlockVariants } from './code-block-variants';

export interface ICodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  highlightedLines?: number[];
}

/**
 * CodeBlock — syntax-highlighted rendering of a `code` Portable Text block,
 * scoped to the `PortableTextRenderer` that owns it. Not a `@blog/ui`
 * component: it wraps the third-party `react-syntax-highlighter`, which
 * `@blog/ui` must stay free of per the layer contract.
 */
export const CodeBlock = ({
  code,
  language,
  filename,
  highlightedLines,
}: ICodeBlockProps) => {
  const s = codeBlockVariants();

  return (
    <figure className={s.root()}>
      {filename ? (
        <figcaption className={s.filename()}>{filename}</figcaption>
      ) : null}
      <SyntaxHighlighter
        language={language ?? 'text'}
        style={oneDark}
        showLineNumbers
        wrapLines
        lineProps={(lineNumber) =>
          highlightedLines?.includes(lineNumber)
            ? { className: s.highlightedLine() }
            : {}
        }
        className={s.pre()}
      >
        {code}
      </SyntaxHighlighter>
    </figure>
  );
};
