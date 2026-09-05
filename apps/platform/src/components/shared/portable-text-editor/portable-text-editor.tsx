'use client';

import type { TPortableTextBlock } from '@blog/db/schema/email-templates';
import { sanitizeHref } from '@blog/email';
import { EMAIL_PORTABLE_TEXT_SCHEMA } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  EditorProvider,
  PortableTextEditable,
  type BlockAnnotationRenderProps,
  type BlockDecoratorRenderProps,
  type BlockListItemRenderProps,
  type BlockStyleRenderProps,
} from '@portabletext/editor';
import { EventListenerPlugin } from '@portabletext/editor/plugins';

import { PortableTextEditorToolbar } from './components/toolbar/portable-text-editor-toolbar';
import { portableTextEditorVariants } from './portable-text-editor-variants';

export type TPortableTextEditorProps = {
  /** Only read once, at mount — this editor owns its own value after that. Force a remount (e.g. `key={templateType}`) to load a different document. */
  initialValue: TPortableTextBlock[];
  onChange: (value: TPortableTextBlock[]) => void;
  ariaLabel: string;
  isDisabled?: boolean;
};

const renderDecorator = ({ value, children }: BlockDecoratorRenderProps) => {
  if (value === 'strong') return <strong>{children}</strong>;
  if (value === 'em') return <em>{children}</em>;
  return children;
};

const renderStyle = ({ value, children }: BlockStyleRenderProps) => {
  if (value === 'h2') return <h2>{children}</h2>;
  return <p>{children}</p>;
};

const renderListItem = ({ children }: BlockListItemRenderProps) => {
  return <li>{children}</li>;
};

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
  const { root, editable, link } = portableTextEditorVariants({ isDisabled });

  const renderAnnotation = ({
    value,
    children,
  }: BlockAnnotationRenderProps) => {
    if (value._type !== 'link') return children;
    const rawHref = typeof value.href === 'string' ? value.href : '';
    const safeHref = sanitizeHref(rawHref);
    return (
      <a href={safeHref ?? undefined} className={link()}>
        {children}
      </a>
    );
  };

  return (
    <div className={root()}>
      <EditorProvider
        initialConfig={{
          schemaDefinition: EMAIL_PORTABLE_TEXT_SCHEMA,
          initialValue: initialValue.length > 0 ? initialValue : undefined,
          readOnly: isDisabled,
        }}
      >
        <EventListenerPlugin
          on={(event) => {
            if (event.type === 'mutation') {
              onChange((event.value ?? []) as TPortableTextBlock[]);
            }
          }}
        />
        {!isDisabled && <PortableTextEditorToolbar />}
        <PortableTextEditable
          aria-label={ariaLabel}
          className={editable()}
          renderDecorator={renderDecorator}
          renderStyle={renderStyle}
          renderListItem={renderListItem}
          renderAnnotation={renderAnnotation}
        />
      </EditorProvider>
    </div>
  );
};
