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
  type SchemaDefinition,
  type TextBlockRenderProps,
} from '@portabletext/editor';
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins';
import * as selectors from '@portabletext/editor/selectors';
import { useMemo, type AriaAttributes } from 'react';

import { PortableTextEditorToolbar } from './components/toolbar/portable-text-editor-toolbar';
import { portableTextEditorVariants } from './portable-text-editor-variants';

export type TPortableTextEditorProps<TBlock = TEmailTemplateBlock> = {
  initialValue: TBlock[];
  onChange: (value: TBlock[]) => void;
  ariaLabel: string;
  schema?: SchemaDefinition;
  id?: string;
  placeholder?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

const strongDecorator = defineDecorator({
  type: 'strong',
  render: ({ children }) => <strong>{children}</strong>,
});

const emDecorator = defineDecorator({
  type: 'em',
  render: ({ children }) => <em>{children}</em>,
});

const isListItemBlock = (
  entry: PortableTextBlock,
): entry is PortableTextTextBlock =>
  entry._type === 'block' &&
  (entry as PortableTextTextBlock).listItem !== undefined;

const countRunNeighbors = (
  value: PortableTextBlock[],
  fromIndex: number,
  step: 1 | -1,
  listItem: string,
  level: number,
): number => {
  let count = 0;
  for (let i = fromIndex; i >= 0 && i < value.length; i += step) {
    const entry = value[i];
    if (!entry || !isListItemBlock(entry)) break;
    if ((entry.level ?? 1) !== level) continue;
    if (entry.listItem !== listItem) break;
    count += 1;
  }
  return count;
};

const getListItemPosition = (
  value: PortableTextBlock[],
  block: PortableTextTextBlock,
): number => {
  const index = value.findIndex((entry) => entry._key === block._key);
  if (index === -1 || block.listItem === undefined) return 1;

  return (
    1 +
    countRunNeighbors(value, index - 1, -1, block.listItem, block.level ?? 1)
  );
};

const getListItemRunSize = (
  value: PortableTextBlock[],
  block: PortableTextTextBlock,
): number => {
  const index = value.findIndex((entry) => entry._key === block._key);
  if (index === -1 || block.listItem === undefined) return 1;

  const level = block.level ?? 1;
  return (
    1 +
    countRunNeighbors(value, index - 1, -1, block.listItem, level) +
    countRunNeighbors(value, index + 1, 1, block.listItem, level)
  );
};

const TextBlock = ({ attributes, children, node }: TextBlockRenderProps) => {
  const editor = useEditor();
  const value = useEditorSelector(editor, selectors.getValue);

  const styled = node.style === 'h2' ? <h2>{children}</h2> : <p>{children}</p>;

  if (node.listItem === undefined) {
    return <div {...attributes}>{styled}</div>;
  }

  const position = getListItemPosition(value, node);
  const setSize = getListItemRunSize(value, node);
  const listItem = (
    <li aria-posinset={position} aria-setsize={setSize}>
      {styled}
    </li>
  );

  return (
    <div {...attributes}>
      {node.listItem === 'number' ? (
        <ol start={position}>{listItem}</ol>
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

export const PortableTextEditor = <TBlock = TEmailTemplateBlock,>({
  initialValue,
  onChange,
  ariaLabel,
  schema = EMAIL_PORTABLE_TEXT_SCHEMA,
  id,
  placeholder,
  isInvalid = false,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TPortableTextEditorProps<TBlock>) => {
  const {
    root,
    editable,
    placeholder: placeholderSlot,
  } = portableTextEditorVariants({ isDisabled, hasToolbar: !isDisabled });

  // @portabletext/editor drops role and aria-multiline entirely when readOnly; restore both so a disabled editor still announces as a (dimmed) text field instead of a nameless generic node.
  const disabledFieldProps = isDisabled
    ? { role: 'textbox', 'aria-multiline': true }
    : {};

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
              className={safeHref ? linkClassName : undefined}
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
          schemaDefinition: schema,
          initialValue:
            initialValue.length > 0
              ? (initialValue as PortableTextBlock[])
              : undefined,
          readOnly: isDisabled,
        }}
      >
        <NodePlugin nodes={nodes} />
        <EventListenerPlugin
          on={(event) => {
            if (event.type === 'mutation') {
              onChange((event.value ?? []) as TBlock[]);
            }
          }}
        />
        {!isDisabled && <PortableTextEditorToolbar schema={schema} />}
        <PortableTextEditable
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid || undefined}
          data-invalid={isInvalid || undefined}
          aria-disabled={isDisabled || undefined}
          renderPlaceholder={
            placeholder
              ? () => <span className={placeholderSlot()}>{placeholder}</span>
              : undefined
          }
          {...disabledFieldProps}
          className={editable()}
        />
      </EditorProvider>
    </div>
  );
};
