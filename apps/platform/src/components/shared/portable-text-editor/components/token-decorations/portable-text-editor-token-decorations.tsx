import { useEditor, useEditorSelector } from '@portabletext/editor';
import { useEffect } from 'react';

import { findTokenRanges } from './find-token-ranges';

export type TPortableTextEditorTokenDecorationsProps = {
  tokens: readonly string[];
  className: string;
};

export const PortableTextEditorTokenDecorations = ({
  tokens,
  className,
}: TPortableTextEditorTokenDecorationsProps) => {
  const editor = useEditor();
  const value = useEditorSelector(editor, ({ context }) => context.value);

  useEffect(() => {
    const registration = editor.registerDecorations({
      decorations: findTokenRanges(value, tokens).map(({ id, range }) => ({
        id,
        type: 'range',
        range,
        render: ({ children }) => <code className={className}>{children}</code>,
      })),
    });
    return () => registration.unregister();
  }, [editor, value, tokens, className]);

  return null;
};
