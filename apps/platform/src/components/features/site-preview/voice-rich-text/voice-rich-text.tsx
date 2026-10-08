import type {
  TVoicePortableText,
  TVoicePortableTextBlock,
  TVoicePortableTextSpan,
} from '@blog/config';
import type { ReactNode } from 'react';

import { voiceRichTextVariants } from './voice-rich-text-variants';

export type TVoiceRichTextProps = {
  value: string | TVoicePortableText;
  params?: Record<string, string>;
};

const PLACEHOLDER = /\{(\w+)\}/g;

const s = voiceRichTextVariants();

const fill = (text: string, params: Record<string, string>): string =>
  text.replace(PLACEHOLDER, (token, key: string) => params[key] ?? token);

const renderSpan = (
  span: TVoicePortableTextSpan,
  block: TVoicePortableTextBlock,
  params: Record<string, string>,
): ReactNode =>
  (span.marks ?? []).reduce<ReactNode>(
    (node, mark) => {
      if (mark === 'strong') return <strong>{node}</strong>;
      if (mark === 'em') return <em>{node}</em>;
      const link = block.markDefs?.find(({ _key }) => _key === mark);
      return link ? (
        <a href={link.href} className={s.link()}>
          {node}
        </a>
      ) : (
        node
      );
    },
    fill(span.text, params),
  );

const renderBlock = (
  block: TVoicePortableTextBlock,
  params: Record<string, string>,
): ReactNode =>
  block.children.map((span) => (
    <span key={span._key}>{renderSpan(span, block, params)}</span>
  ));

/** Renders a Voice value as phrasing content, so it can sit inside a specimen's own `<p>`. */
export const VoiceRichText = ({ value, params = {} }: TVoiceRichTextProps) => {
  if (typeof value === 'string') return fill(value, params);
  const [onlyBlock, ...rest] = value;
  if (onlyBlock && rest.length === 0) return renderBlock(onlyBlock, params);

  return value.map((block) => (
    <span key={block._key} className={s.line()}>
      {renderBlock(block, params)}
    </span>
  ));
};
