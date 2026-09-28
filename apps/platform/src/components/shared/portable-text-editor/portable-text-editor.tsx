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
} from '@portabletext/editor';
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins';
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

const textBlock = defineTextBlock({
  type: 'block',
  render: ({ attributes, children, node }) => {
    const styled =
      node.style === 'h2' ? <h2>{children}</h2> : <p>{children}</p>;
    const content = node.listItem !== undefined ? <li>{styled}</li> : styled;
    return <div {...attributes}>{content}</div>;
  },
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
