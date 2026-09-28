'use client';

import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { sanitizeHref } from '@blog/email/html';
import { EMAIL_PORTABLE_TEXT_SCHEMA } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  defineAnnotation,
  defineDecorator,
  defineTextBlock,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type PortableTextBlock,
  type PortableTextTextBlock,
  type TextBlockRenderProps,
} from '@portabletext/editor';
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins';
import * as selectors from '@portabletext/editor/selectors';
import { useMemo } from 'react';

import { PortableTextEditorToolbar } from './components/toolbar/portable-text-editor-toolbar';
import { portableTextEditorVariants } from './portable-text-editor-variants';

export type TPortableTextEditorProps = {
  initialValue: TEmailTemplateBlock[];
  onChange: (value: TEmailTemplateBlock[]) => void;
  ariaLabel: string;
  isDisabled?: boolean;
};

const strongDecorator = defineDecorator({
  type: 'strong',
  render: ({ children }) => <strong>{children}</strong>,
});

const emDecorator = defineDecorator({
  type: 'em',
  render: ({ children }) => <em>{children}</em>,
});

const isSameListRunMember = (
  entry: PortableTextBlock,
  listItem: string,
  level: number,
): boolean =>
  entry._type === 'block' &&
  (entry as PortableTextTextBlock).listItem === listItem &&
  ((entry as PortableTextTextBlock).level ?? 1) === level;

const getListItemPosition = (
  value: PortableTextBlock[],
  block: PortableTextTextBlock,
): number => {
  const index = value.findIndex((entry) => entry._key === block._key);
  if (index === -1 || block.listItem === undefined) return 1;

  let position = 1;
  for (let i = index - 1; i >= 0; i -= 1) {
    const entry = value[i];
    if (entry && isSameListRunMember(entry, block.listItem, block.level ?? 1)) {
      position += 1;
    } else {
      break;
    }
  }
  return position;
};

const TextBlock = ({ attributes, children, node }: TextBlockRenderProps) => {
  const editor = useEditor();
  const value = useEditorSelector(editor, selectors.getValue);

  const styled = node.style === 'h2' ? <h2>{children}</h2> : <p>{children}</p>;

  if (node.listItem === undefined) {
    return <div {...attributes}>{styled}</div>;
  }

  const listItem = <li>{styled}</li>;

  return (
    <div {...attributes}>
      {node.listItem === 'number' ? (
        <ol start={getListItemPosition(value, node)}>{listItem}</ol>
      ) : (
        <ul>{listItem}</ul>
      )}
    </div>
  );
};

const textBlock = defineTextBlock({
  type: 'block',
  render: (props) => <TextBlock {...props} />,
});

/**
 * The editor's authoring surface — Base UI's primitives don't cover rich
 * text, so this composes `@portabletext/editor`'s own headless building
 * blocks directly, restricted to `EMAIL_PORTABLE_TEXT_SCHEMA`'s vocabulary.
 */
export const PortableTextEditor = ({
  initialValue,
  onChange,
  ariaLabel,
  isDisabled = false,
}: TPortableTextEditorProps) => {
  const { root, editable } = portableTextEditorVariants({ isDisabled });

  const nodes = useMemo(() => {
    const linkClassName = portableTextEditorVariants({ isDisabled }).link();
    return [
      strongDecorator,
      emDecorator,
      textBlock,
      defineAnnotation({
        type: 'link',
        render: ({ annotation, children }) => {
          const rawHref =
            typeof annotation.href === 'string' ? annotation.href : '';
          const safeHref = sanitizeHref(rawHref);
          return (
            <a
              href={safeHref ?? undefined}
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {children}
            </a>
          );
        },
      }),
    ];
  }, [isDisabled]);

  return (
    <div className={root()}>
      <EditorProvider
        initialConfig={{
          schemaDefinition: EMAIL_PORTABLE_TEXT_SCHEMA,
          initialValue: initialValue.length > 0 ? initialValue : undefined,
          readOnly: isDisabled,
        }}
      >
        <NodePlugin nodes={nodes} />
        <EventListenerPlugin
          on={(event) => {
            if (event.type === 'mutation') {
              onChange((event.value ?? []) as TEmailTemplateBlock[]);
            }
          }}
        />
        {!isDisabled && <PortableTextEditorToolbar />}
        <PortableTextEditable aria-label={ariaLabel} className={editable()} />
      </EditorProvider>
    </div>
  );
};
