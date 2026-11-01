'use client';

import { SIZE } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import {
  CONTROL_MODE,
  type TControlMode,
} from '@platform/constants/control-mode';
import { EMAIL_PORTABLE_TEXT_SCHEMA } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  defineAnnotation,
  defineDecorator,
  defineTextBlock,
  EditorProvider,
  PortableTextEditable,
  type PortableTextBlock,
  type SchemaDefinition,
} from '@portabletext/editor';
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins';

import { PortableTextEditorLinkAnnotation } from './components/link-annotation/portable-text-editor-link-annotation';
import { PortableTextEditorTextBlock } from './components/text-block/portable-text-editor-text-block';
import { PortableTextEditorTokenDecorations } from './components/token-decorations/portable-text-editor-token-decorations';
import { PortableTextEditorToolbar } from './components/toolbar/portable-text-editor-toolbar';
import {
  portableTextEditorVariants,
  type TPortableTextEditorSize,
} from './portable-text-editor-variants';

type TPortableTextEditorField = {
  label: string;
  id?: string;
  isInvalid?: boolean;
  describedBy?: string;
  tokens?: readonly string[];
};

export type TPortableTextEditorProps<TBlock = TEmailTemplateBlock> = {
  initialValue: TBlock[];
  onChange: (value: TBlock[]) => void;
  field: TPortableTextEditorField;
  schema?: SchemaDefinition;
  placeholder?: string;
  mode?: TControlMode;
  size?: TPortableTextEditorSize;
};

const strongDecorator = defineDecorator({
  type: 'strong',
  render: ({ children }) => <strong>{children}</strong>,
});

const emDecorator = defineDecorator({
  type: 'em',
  render: ({ children }) => <em>{children}</em>,
});

const textBlock = defineTextBlock({
  type: 'block',
  render: (props) => <PortableTextEditorTextBlock {...props} />,
});

const linkAnnotation = defineAnnotation({
  type: 'link',
  render: (props) => <PortableTextEditorLinkAnnotation {...props} />,
});

const nodes = [strongDecorator, emDecorator, textBlock, linkAnnotation];

export const PortableTextEditor = <TBlock = TEmailTemplateBlock,>({
  initialValue,
  onChange,
  field,
  schema = EMAIL_PORTABLE_TEXT_SCHEMA,
  placeholder,
  mode = CONTROL_MODE.EDITABLE,
  size = SIZE.MD,
}: TPortableTextEditorProps<TBlock>) => {
  const { label, id, isInvalid = false, describedBy, tokens } = field;
  const isEditable = mode === CONTROL_MODE.EDITABLE;
  const appliedSize = isEditable ? size : SIZE.MD;
  const {
    root,
    editable,
    placeholder: placeholderSlot,
    token,
  } = portableTextEditorVariants({ mode, size: appliedSize });

  // @portabletext/editor drops role and aria-multiline entirely when readOnly; restore both so a non-editable editor still announces as a text field instead of a nameless generic node.
  const nonEditableFieldProps = isEditable
    ? {}
    : {
        role: 'textbox',
        'aria-multiline': true,
        ...(mode === CONTROL_MODE.DISABLED
          ? { 'aria-disabled': true }
          : { 'aria-readonly': true, tabIndex: 0 }),
      };

  return (
    <div className={root()}>
      <EditorProvider
        initialConfig={{
          schemaDefinition: schema,
          initialValue:
            initialValue.length > 0
              ? (initialValue as PortableTextBlock[])
              : undefined,
          readOnly: !isEditable,
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
        {tokens !== undefined && tokens.length > 0 && (
          <PortableTextEditorTokenDecorations
            tokens={tokens}
            className={token()}
          />
        )}
        {isEditable && (
          <PortableTextEditorToolbar schema={schema} size={appliedSize} />
        )}
        <PortableTextEditable
          id={id}
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || undefined}
          data-invalid={isInvalid || undefined}
          renderPlaceholder={
            placeholder
              ? () => <span className={placeholderSlot()}>{placeholder}</span>
              : undefined
          }
          {...nonEditableFieldProps}
          className={editable()}
        />
      </EditorProvider>
    </div>
  );
};
